import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Images,
  Trash2,
  X,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import {
  auditTrails,
  inventory,
  inventoryTransactionItems,
  materials,
  transactionItems,
  transactions,
} from "../db/schema";
import { db } from "../db/client";

// --- REUSABLE COMPONENT: Custom Modal Picker ---
const CustomPicker = ({
  selectedValue,
  onValueChange,
  placeholder,
  items,
  enabled = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((i) => i.value === selectedValue);
  const displayLabel = selectedItem ? selectedItem.label : placeholder;

  return (
    <>
      <Pressable
        onPress={() => enabled && setModalVisible(true)}
        style={[styles.pickerTrigger, !enabled && styles.pickerDisabled]}
      >
        <Text
          style={[
            styles.pickerText,
            !selectedValue && styles.placeholderText,
            !enabled && styles.textDisabled,
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <ChevronDown size={20} color={enabled ? "gray" : "#9ca3af"} />
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.pickerOptionsContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="gray" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    selectedValue === item.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedValue === item.value &&
                        styles.pickerOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Check size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default function ScannedInventory() {
  // Get params
  const params = useLocalSearchParams();
  const passedBatchId = params.batchId;
  const { width } = useWindowDimensions(); // Get screen width for carousel

  // State
  const [inventoryBatches, setInventoryBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [lineItems, setLineItems] = useState([]);

  // Searchable Dropdown State
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [filteredBatches, setFilteredBatches] = useState([]);

  // Form State
  const [scannedData, setScannedData] = useState({
    material: "",
    netWeight: "",
    uom: "",
    supplier: "Unknown",
    location: "Warehouse A",
    materialId: null,
  });
  const [status, setStatus] = useState("Verified");
  const [notes, setNotes] = useState("");

  // Evidence Images
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [galleryModalVisible, setGalleryModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Track carousel index

  const [adjustedWeight, setAdjustedWeight] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);

  // Load Inventory Batches
  const loadBatches = async () => {
    try {
      const result = await db
        .select({
          id: inventory.id,
          batchId: inventory.batchId,
          materialName: materials.name,
          netWeight: inventory.netWeight,
          uom: materials.uom,
          materialId: materials.id,
        })
        .from(inventory)
        .leftJoin(materials, eq(inventory.materialId, materials.id));

      const formattedBatches = result.map((b) => ({
        label: `${b.batchId} - ${b.materialName}`,
        displayLabel: b.batchId,
        value: b.id,
        ...b,
      }));

      setInventoryBatches(formattedBatches);
      setFilteredBatches(formattedBatches);

      if (passedBatchId) {
        const target = formattedBatches.find(
          (b) => b.displayLabel === passedBatchId,
        );
        if (target) {
          handleBatchChange(target);
        }
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load inventory batches");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBatches();
    }, [passedBatchId]),
  );

  // Search Logic
  useEffect(() => {
    if (!batchSearchQuery) {
      setFilteredBatches(inventoryBatches);
    } else {
      const lowerQ = batchSearchQuery.toLowerCase();
      const filtered = inventoryBatches.filter((b) =>
        b.label.toLowerCase().includes(lowerQ),
      );
      setFilteredBatches(filtered);
    }
  }, [batchSearchQuery, inventoryBatches]);

  // Load Line Items for Batch
  const loadLineItems = async (invId) => {
    try {
      const items = await db
        .select({
          id: inventoryTransactionItems.id,
          txId: transactions.id,
          date: transactions.date,
          allocated: inventoryTransactionItems.allocatedWeight,
          type: transactions.type,
        })
        .from(inventoryTransactionItems)
        .leftJoin(
          transactionItems,
          eq(inventoryTransactionItems.transactionItemId, transactionItems.id),
        )
        .leftJoin(
          transactions,
          eq(transactionItems.transactionId, transactions.id),
        )
        .where(eq(inventoryTransactionItems.inventoryId, invId));

      setLineItems(items);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBatchChange = (batchItem) => {
    setSelectedBatchId(batchItem.value);
    setBatchSearchQuery(batchItem.label);
    setIsBatchDropdownOpen(false);
    Keyboard.dismiss();

    setEvidenceImages([]);
    setAdjustedWeight("");

    if (batchItem) {
      setScannedData({
        material: batchItem.materialName || "Unknown",
        netWeight: batchItem.netWeight.toString(),
        uom: batchItem.uom || "kg",
        supplier: "MetalCorp Intl.",
        location: "Zone A - Rack 4",
        materialId: batchItem.materialId,
      });
      loadLineItems(batchItem.value);
    }
  };

  const handleClearBatch = () => {
    setBatchSearchQuery("");
    setSelectedBatchId(null);
    setFilteredBatches(inventoryBatches);
    setScannedData({
      material: "",
      netWeight: "",
      uom: "",
      supplier: "",
      location: "",
      materialId: null,
    });
    setLineItems([]);
    setEvidenceImages([]);
    setAdjustedWeight("");
    setIsBatchDropdownOpen(true);
  };

  const handleNumericInput = (text, setter) => {
    if (text === "" || /^\d*\.?\d*$/.test(text)) {
      setter(text);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "Camera access is needed.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setEvidenceImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = () => {
    // Remove the currently visible image
    setEvidenceImages((prev) =>
      prev.filter((_, idx) => idx !== currentImageIndex),
    );
    // Adjust index if we deleted the last image
    if (currentImageIndex >= evidenceImages.length - 1) {
      setCurrentImageIndex(Math.max(0, evidenceImages.length - 2));
    }
    // If no images left, close modal automatically (optional, but good UX)
    if (evidenceImages.length === 1) {
      setGalleryModalVisible(false);
    }
  };

  // Carousel Scroll Handler
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  };

  const handleSubmit = () => {
    if (!selectedBatchId) {
      Alert.alert("Error", "Please select a batch first.");
      return;
    }
    if (
      status === "Adjusted" &&
      (!adjustedWeight || isNaN(parseFloat(adjustedWeight)))
    ) {
      Alert.alert("Error", "Please enter a valid new weight.");
      return;
    }
    setModalVisible(true);
  };

  const handleConfirmModal = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      const currentWeight = parseFloat(scannedData.netWeight);
      const newWeightVal =
        status === "Adjusted" ? parseFloat(adjustedWeight) : null;

      const evidenceJson =
        evidenceImages.length > 0 ? JSON.stringify(evidenceImages) : null;

      await db.transaction(async (tx) => {
        await tx.insert(auditTrails).values({
          inventoryId: selectedBatchId,
          action: status,
          notes: notes,
          date: today,
          evidenceImageUri: evidenceJson,
          previousWeight: status === "Adjusted" ? currentWeight : null,
          newWeight: newWeightVal,
        });

        if (status === "Adjusted" && newWeightVal !== null) {
          await tx
            .update(inventory)
            .set({ netWeight: newWeightVal })
            .where(eq(inventory.id, selectedBatchId));

          const weightDiff = currentWeight - newWeightVal;

          if (weightDiff !== 0) {
            const isLoss = weightDiff > 0;
            const type = isLoss ? "Adjustment-Loss" : "Adjustment-Gain";
            const absWeight = Math.abs(weightDiff);

            const txRes = await tx
              .insert(transactions)
              .values({
                type: type,
                date: today,
                status: "Completed",
                totalAmount: 0,
              })
              .returning();
            const newTxId = txRes[0].id;

            const txItemRes = await tx
              .insert(transactionItems)
              .values({
                transactionId: newTxId,
                materialId: scannedData.materialId,
                weight: absWeight,
                price: 0,
                subtotal: 0,
              })
              .returning();
            const newTxItemId = txItemRes[0].id;

            await tx.insert(inventoryTransactionItems).values({
              inventoryId: selectedBatchId,
              transactionItemId: newTxItemId,
              allocatedWeight: absWeight,
            });
          }
        }
      });

      setModalVisible(false);
      setNotes("");
      setStatus("Verified");
      setSelectedBatchId(null);
      setBatchSearchQuery("");
      setScannedData({
        material: "",
        netWeight: "",
        uom: "",
        supplier: "",
        location: "",
        materialId: null,
      });
      setEvidenceImages([]);
      setAdjustedWeight("");
      setLineItems([]);

      Alert.alert("Success", "Audit record saved & inventory updated.");
      router.push("/auditTrails");
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      Alert.alert("Error", "Failed to save audit record: " + errorMessage);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4" style={{ zIndex: 1 }}>
      {/* CLICK OUTSIDE OVERLAY */}
      {isBatchDropdownOpen && (
        <Pressable
          className="absolute top-0 left-0 right-0 bottom-0 z-40"
          onPress={() => {
            setIsBatchDropdownOpen(false);
            Keyboard.dismiss();
          }}
        />
      )}

      {/* HEADER ROW with SEARCHABLE DROPDOWN */}
      <View className="items-center justify-center z-50">
        <Text className="text-gray-500 font-bold mb-2 uppercase tracking-widest">
          Item Details
        </Text>
        <View className="w-[80%] relative z-50">
          <View className="flex-row items-center bg-white border-2 border-gray-300 rounded-md h-12 px-2">
            <TextInput
              value={batchSearchQuery}
              onChangeText={(text) => {
                setBatchSearchQuery(text);
                setIsBatchDropdownOpen(true);
                setSelectedBatchId(null);
              }}
              onFocus={() => setIsBatchDropdownOpen(true)}
              placeholder="Type to filter Batch ID..."
              className="flex-1 text-base text-black h-full"
            />
            {batchSearchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearBatch} className="mr-2">
                <XCircle size={18} color="gray" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
            >
              {isBatchDropdownOpen ? (
                <ChevronUp size={20} color="gray" />
              ) : (
                <ChevronDown size={20} color="gray" />
              )}
            </TouchableOpacity>
          </View>

          {/* ABSOLUTE DROPDOWN LIST */}
          {isBatchDropdownOpen && (
            <View
              className="absolute top-12 left-0 right-0 bg-white border border-gray-300 rounded-b-md shadow-lg z-50 elevation-5"
              style={{ maxHeight: 400 }}
            >
              <FlatList
                data={filteredBatches}
                keyExtractor={(item) => item.value.toString()}
                nestedScrollEnabled={true}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="p-3 border-b border-gray-100 active:bg-blue-50"
                    onPress={() => handleBatchChange(item)}
                  >
                    <Text className="font-bold text-gray-800">
                      {item.displayLabel}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {item.materialName}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text className="p-3 text-gray-500 italic">
                    No batches found
                  </Text>
                }
              />
            </View>
          )}
        </View>
      </View>

      {/* ROW 2: Info & Action */}
      <View className="flex-row gap-4 -z-10">
        <View className="flex-1">
          <Text className="text-gray-600 font-bold mb-1">Material</Text>
          <TextInput
            className="bg-gray-200 h-12 rounded-md px-3 text-gray-500"
            value={scannedData.material}
            editable={false}
          />
        </View>
        <View className="flex-1">
          <Text className="text-black font-bold mb-1">Status Check</Text>
          <View className="h-12">
            <CustomPicker
              selectedValue={status}
              onValueChange={setStatus}
              items={[
                { label: "Verified", value: "Verified" },
                { label: "Damaged", value: "Damaged" },
                { label: "Adjust", value: "Adjusted" },
              ]}
            />
          </View>
        </View>
      </View>

      {/* ROW 3: Weights (Conditional) */}
      <View className="flex-row gap-4 -z-10">
        <View className="flex-1">
          <Text className="text-gray-600 font-bold mb-1">Current Weight</Text>
          <TextInput
            className="bg-gray-200 h-12 rounded-md px-3 text-gray-500 font-bold"
            value={
              scannedData.netWeight
                ? `${scannedData.netWeight} ${scannedData.uom}`
                : ""
            }
            editable={false}
          />
        </View>

        {status === "Adjusted" && (
          <View className="flex-1">
            <Text className="text-blue-600 font-bold mb-1">
              New Weight (kg)
            </Text>
            <TextInput
              className="bg-white h-12 rounded-md px-3 text-blue-800 border-2 border-blue-500 font-bold"
              value={adjustedWeight}
              onChangeText={(text) =>
                handleNumericInput(text, setAdjustedWeight)
              }
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      {/* ROW 4: Photo Evidence & Notes */}
      <View className="flex-row gap-4 -z-10">
        <View className="flex-1">
          <Text className="text-gray-700 font-bold mb-1">
            Evidence ({evidenceImages.length})
          </Text>

          <View className="h-48 border-2 border-dashed border-gray-300 bg-gray-50 rounded-md p-2">
            <TouchableOpacity
              onPress={handleTakePhoto}
              className="flex-row items-center justify-center p-3 bg-white border border-gray-300 rounded shadow-sm"
            >
              <Camera size={20} color="#4b5563" />
              <Text className="text-gray-700 font-bold ml-2 text-xs">
                Add Photo
              </Text>
            </TouchableOpacity>

            {evidenceImages.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-400 text-xs italic">
                  No photos added
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setCurrentImageIndex(0);
                  setGalleryModalVisible(true);
                }}
                className="flex-1 mt-2 bg-blue-50 border border-blue-200 rounded-md items-center justify-center flex-row gap-2"
              >
                <Images size={24} color="#2563eb" />
                <Text className="text-blue-700 font-bold text-sm">
                  View Captured ({evidenceImages.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="flex-[1.5]">
          <Text className="text-black font-bold mb-1">Notes</Text>
          <TextInput
            className="bg-white h-48 rounded-md p-3 border border-gray-200"
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add remarks..."
          />
        </View>
      </View>

      {/* TABLE SECTION */}
      <View className="mt-4 bg-white rounded-md border border-gray-200 overflow-hidden flex-1 -z-10">
        <View className="bg-gray-100 p-3 border-b border-gray-200">
          <Text className="text-gray-700 font-bold text-xs uppercase">
            Transaction History (Source)
          </Text>
        </View>

        <ScrollView className="flex-1">
          {lineItems.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="text-gray-400 italic">
                No source transactions found.
              </Text>
            </View>
          ) : (
            <View>
              <View className="flex-row bg-gray-50 p-2 border-b border-gray-100">
                <Text className="flex-1 text-xs font-bold text-gray-500">
                  TX ID
                </Text>
                <Text className="flex-1 text-xs font-bold text-gray-500">
                  Type
                </Text>
                <Text className="flex-1 text-xs font-bold text-gray-500">
                  Date
                </Text>
                <Text className="flex-1 text-xs font-bold text-gray-500 text-right">
                  Allocated
                </Text>
              </View>
              {lineItems.map((item, idx) => (
                <View
                  key={idx}
                  className="flex-row p-2 border-b border-gray-50 items-center"
                >
                  <Text className="flex-1 text-xs text-gray-800">
                    #{item.txId}
                  </Text>
                  <Text className="flex-1 text-xs text-blue-600 font-medium">
                    {item.type}
                  </Text>
                  <Text className="flex-1 text-xs text-gray-600">
                    {item.date}
                  </Text>
                  <Text className="flex-1 text-xs text-gray-800 text-right font-bold">
                    {item.allocated} kg
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* SUBMIT BUTTON */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-blue-600 h-14 rounded-md justify-center items-center shadow-sm mt-2 mb-2 active:bg-blue-700 -z-10"
      >
        <Text className="text-white font-bold text-lg uppercase tracking-wider">
          Confirm Audit
        </Text>
      </TouchableOpacity>

      {/* GALLERY CAROUSEL MODAL */}
      <Modal
        visible={galleryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGalleryModalVisible(false)}
      >
        <View className="flex-1 bg-black">
          {/* Top Bar */}
          <View className="flex-row justify-between items-center p-4 mt-8 z-10">
            <Text className="text-white font-bold text-xl">
              Evidence Gallery
            </Text>
            <TouchableOpacity
              onPress={() => setGalleryModalVisible(false)}
              className="bg-gray-800 p-2 rounded-full"
            >
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Carousel */}
          <View className="flex-1 justify-center items-center">
            {evidenceImages.length > 0 ? (
              <FlatList
                data={evidenceImages}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16} // smooth updates
                renderItem={({ item }) => (
                  <View style={{ width, justifyContent: "center" }}>
                    <Image
                      source={{ uri: item }}
                      style={{ width: width, height: "80%" }}
                      resizeMode="contain"
                    />
                  </View>
                )}
              />
            ) : (
              <Text className="text-gray-500">No images available</Text>
            )}
          </View>

          {/* Bottom Bar: Counter & Delete */}
          {evidenceImages.length > 0 && (
            <View className="absolute bottom-10 left-0 right-0 items-center justify-center gap-4">
              <View className="bg-gray-800 px-4 py-1 rounded-full">
                <Text className="text-white font-bold">
                  {currentImageIndex + 1} / {evidenceImages.length}
                </Text>
              </View>

              <TouchableOpacity
                onPress={removeImage}
                className="bg-red-600 flex-row items-center gap-2 px-6 py-3 rounded-full shadow-lg"
              >
                <Trash2 size={20} color="white" />
                <Text className="text-white font-bold">Delete Image</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-sm rounded-lg p-6 shadow-lg">
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Confirm Audit?
            </Text>
            <Text className="text-gray-600 mb-4">
              Log <Text className="font-bold">{status}</Text> for{" "}
              <Text className="font-bold">
                {
                  inventoryBatches.find((b) => b.value === selectedBatchId)
                    ?.label
                }
              </Text>
              ?
            </Text>

            {status === "Adjusted" && (
              <View className="bg-yellow-50 p-3 rounded-md mb-4 border border-yellow-200">
                <Text className="text-yellow-800 text-xs font-bold uppercase">
                  Weight Change
                </Text>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-gray-500 line-through">
                    {scannedData.netWeight} kg
                  </Text>
                  <Text className="text-blue-600 font-bold text-lg">
                    {adjustedWeight} kg
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 bg-gray-200 p-3 rounded-md"
              >
                <Text className="text-gray-700 text-center font-bold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmModal}
                className="flex-1 bg-blue-600 p-3 rounded-md"
              >
                <Text className="text-white text-center font-bold">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // New Styles for the Custom Picker
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    height: "100%",
    width: "100%",
  },
  pickerDisabled: {
    backgroundColor: "#e5e7eb",
    borderColor: "#d1d5db",
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 16,
    color: "black",
    flex: 1,
  },
  textDisabled: {
    color: "#9ca3af",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  // Modal Styles for Picker
  pickerOptionsContainer: {
    backgroundColor: "white",
    width: "40%",
    maxHeight: "50%",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  pickerOptionSelected: {
    backgroundColor: "#eff6ff",
    borderRadius: 6,
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#4b5563",
  },
  pickerOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  // Main Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
