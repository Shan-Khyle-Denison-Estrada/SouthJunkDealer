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
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  auditTrails,
  inventory,
  inventoryTransactionItems,
  materials,
  transactionItems,
  transactions,
} from "../db/schema";

// --- REUSABLE COMPONENT: Custom Modal Picker ---
const CustomPicker = ({
  selectedValue,
  onValueChange,
  placeholder,
  items,
  enabled = true,
  theme,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((i) => i.value === selectedValue);
  const displayLabel = selectedItem ? selectedItem.label : placeholder;

  return (
    <>
      <Pressable
        onPress={() => enabled && setModalVisible(true)}
        style={[
          styles.pickerTrigger,
          !enabled && styles.pickerDisabled,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
            opacity: enabled ? 1 : 0.6,
          },
        ]}
      >
        <Text
          style={[
            styles.pickerText,
            !selectedValue && styles.placeholderText,
            !enabled && styles.textDisabled,
            {
              color: selectedValue ? theme.textPrimary : theme.placeholder,
            },
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <ChevronDown
          size={20}
          color={enabled ? theme.textSecondary : theme.placeholder}
        />
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
          <View
            style={[
              styles.pickerOptionsContainer,
              { backgroundColor: theme.card },
            ]}
          >
            <View
              style={[styles.pickerHeader, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.pickerTitle, { color: theme.textPrimary }]}>
                {placeholder}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: theme.subtleBorder },
                    selectedValue === item.value && {
                      backgroundColor: theme.highlightBg,
                    },
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      { color: theme.textSecondary },
                      selectedValue === item.value && {
                        color: theme.primary,
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Check size={20} color={theme.primary} />
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
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6",
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937", // Gray-800
    textSecondary: isDark ? "#A1A1AA" : "#4b5563", // Gray-600
    border: isDark ? "#333333" : "#e5e7eb",
    subtleBorder: isDark ? "#2C2C2C" : "#f9fafb",
    inputBg: isDark ? "#2C2C2C" : "#f3f4f6", // Default input bg
    inputBgReadOnly: isDark ? "#252525" : "#e5e7eb", // Slightly different for disabled
    inputText: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    highlightBg: isDark ? "#1e3a8a" : "#eff6ff",
    headerBg: isDark ? "#0f0f0f" : "#f3f4f6",
    primary: "#2563eb",
  };

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

    // --- VALIDATION: Check for Evidence Image ---
    if (evidenceImages.length === 0) {
      Alert.alert(
        "Validation Error",
        "At least one evidence photo is required to submit the audit.",
      );
      return;
    }

    // --- UPDATED VALIDATION: Check for Adjusted or Damaged Weight ---
    const isWeightAdjustmentNeeded =
      status === "Adjusted" || status === "Damaged";
    if (
      isWeightAdjustmentNeeded &&
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

      // --- UPDATED LOGIC: Trigger for both Adjusted and Damaged ---
      const isWeightAdjustmentNeeded =
        status === "Adjusted" || status === "Damaged";
      const newWeightVal = isWeightAdjustmentNeeded
        ? parseFloat(adjustedWeight)
        : null;

      const evidenceJson =
        evidenceImages.length > 0 ? JSON.stringify(evidenceImages) : null;

      await db.transaction(async (tx) => {
        await tx.insert(auditTrails).values({
          inventoryId: selectedBatchId,
          action: status,
          notes: notes,
          date: today,
          evidenceImageUri: evidenceJson,
          previousWeight: isWeightAdjustmentNeeded ? currentWeight : null,
          newWeight: newWeightVal,
        });

        if (isWeightAdjustmentNeeded && newWeightVal !== null) {
          await tx
            .update(inventory)
            .set({ netWeight: newWeightVal })
            .where(eq(inventory.id, selectedBatchId));

          const weightDiff = currentWeight - newWeightVal;

          if (weightDiff !== 0) {
            const isLoss = weightDiff > 0;
            // Differentiate transaction type based on status if needed,
            // or use generic Adjustment types.
            // If Damaged, it's usually a loss, but logic remains strictly weight diff based here.
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

  const isWeightInputVisible = status === "Adjusted" || status === "Damaged";

  return (
    <View
      className="flex-1 p-4 gap-4"
      style={{ zIndex: 1, backgroundColor: theme.background }}
    >
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
        <Text
          className="font-bold mb-2 uppercase tracking-widest"
          style={{ color: theme.textSecondary }}
        >
          Item Details <Text className="text-red-500">*</Text>
        </Text>
        <View className="w-[80%] relative z-50">
          <View
            className="flex-row items-center border-2 rounded-md h-12 px-2"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
            }}
          >
            <TextInput
              value={batchSearchQuery}
              onChangeText={(text) => {
                setBatchSearchQuery(text);
                setIsBatchDropdownOpen(true);
                setSelectedBatchId(null);
              }}
              onFocus={() => setIsBatchDropdownOpen(true)}
              placeholder="Type to filter Batch ID..."
              placeholderTextColor={theme.placeholder}
              className="flex-1 text-base h-full"
              style={{ color: theme.inputText }}
            />
            {batchSearchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearBatch} className="mr-2">
                <XCircle size={18} color={theme.placeholder} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
            >
              {isBatchDropdownOpen ? (
                <ChevronUp size={20} color={theme.placeholder} />
              ) : (
                <ChevronDown size={20} color={theme.placeholder} />
              )}
            </TouchableOpacity>
          </View>
          {/* ABSOLUTE DROPDOWN LIST */}
          {isBatchDropdownOpen && (
            <View
              className="absolute top-12 left-0 right-0 border rounded-b-md shadow-lg z-50 elevation-5"
              style={{
                maxHeight: 400,
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <FlatList
                data={filteredBatches}
                keyExtractor={(item) => item.value.toString()}
                nestedScrollEnabled={true}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="p-3 border-b"
                    style={{ borderBottomColor: theme.subtleBorder }}
                    onPress={() => handleBatchChange(item)}
                  >
                    <Text
                      className="font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {item.displayLabel}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: theme.textSecondary }}
                    >
                      {item.materialName}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text
                    className="p-3 italic"
                    style={{ color: theme.placeholder }}
                  >
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
          <Text
            className="font-bold mb-1"
            style={{ color: theme.textSecondary }}
          >
            Material
          </Text>
          <TextInput
            className="h-12 rounded-md px-3"
            style={{
              backgroundColor: theme.inputBgReadOnly,
              color: theme.textSecondary,
            }}
            value={scannedData.material}
            editable={false}
          />
        </View>
        <View className="flex-1">
          <Text className="font-bold mb-1" style={{ color: theme.textPrimary }}>
            Status Check <Text className="text-red-500">*</Text>
          </Text>
          <View className="h-12">
            <CustomPicker
              selectedValue={status}
              onValueChange={setStatus}
              items={[
                { label: "Verified", value: "Verified" },
                { label: "Damaged", value: "Damaged" },
                { label: "Adjust", value: "Adjusted" },
              ]}
              theme={theme}
            />
          </View>
        </View>
      </View>

      {/* ROW 3: Weights (Conditional) */}
      <View className="flex-row gap-4 -z-10">
        <View className="flex-1">
          <Text
            className="font-bold mb-1"
            style={{ color: theme.textSecondary }}
          >
            Current Weight
          </Text>
          <TextInput
            className="h-12 rounded-md px-3 font-bold"
            style={{
              backgroundColor: theme.inputBgReadOnly,
              color: theme.textSecondary,
            }}
            value={
              scannedData.netWeight
                ? `${scannedData.netWeight} ${scannedData.uom}`
                : ""
            }
            editable={false}
          />
        </View>
        {isWeightInputVisible && (
          <View className="flex-1">
            <Text className="text-blue-600 font-bold mb-1">
              New Weight (kg)
            </Text>
            <TextInput
              className="h-12 rounded-md px-3 border-2 font-bold"
              style={{
                backgroundColor: theme.inputBg,
                color: theme.primary,
                borderColor: theme.primary,
              }}
              value={adjustedWeight}
              onChangeText={(text) =>
                handleNumericInput(text, setAdjustedWeight)
              }
              placeholder="0.00"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      {/* ROW 4: Photo Evidence & Notes */}
      <View className="flex-row gap-4 -z-10">
        <View className="flex-1">
          <Text
            className="font-bold mb-1"
            style={{ color: theme.textSecondary }}
          >
            Evidence ({evidenceImages.length}){" "}
            <Text style={{ color: "red" }}>*</Text>
          </Text>
          <View
            className="h-48 border-2 border-dashed rounded-md p-2"
            style={{
              backgroundColor: theme.rowOdd,
              borderColor: evidenceImages.length === 0 ? "red" : theme.border,
            }}
          >
            <TouchableOpacity
              onPress={handleTakePhoto}
              className="flex-row items-center justify-center p-3 border rounded shadow-sm"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <Camera size={20} color={theme.textSecondary} />
              <Text
                className="font-bold ml-2 text-xs"
                style={{ color: theme.textPrimary }}
              >
                Add Photo
              </Text>
            </TouchableOpacity>
            {evidenceImages.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Text
                  className="text-xs italic"
                  style={{ color: theme.placeholder }}
                >
                  Required
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setCurrentImageIndex(0);
                  setGalleryModalVisible(true);
                }}
                className="flex-1 mt-2 border rounded-md items-center justify-center flex-row gap-2"
                style={{
                  backgroundColor: theme.highlightBg,
                  borderColor: theme.primary,
                }}
              >
                <Images size={24} color={theme.primary} />
                <Text
                  className="font-bold text-sm"
                  style={{ color: theme.primary }}
                >
                  View Captured ({evidenceImages.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View className="flex-[1.5]">
          <Text className="font-bold mb-1" style={{ color: theme.textPrimary }}>
            Notes
          </Text>
          <TextInput
            className="h-48 rounded-md p-3 border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.inputText,
            }}
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add remarks..."
            placeholderTextColor={theme.placeholder}
          />
        </View>
      </View>

      {/* TABLE SECTION */}
      <View
        className="mt-4 rounded-md border overflow-hidden flex-1 -z-10"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        <View
          className="p-3 border-b"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.border,
          }}
        >
          <Text
            className="font-bold text-xs uppercase"
            style={{ color: theme.textSecondary }}
          >
            Transaction History (Source)
          </Text>
        </View>
        <ScrollView className="flex-1">
          {lineItems.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="italic" style={{ color: theme.placeholder }}>
                No source transactions found.
              </Text>
            </View>
          ) : (
            <View>
              <View
                className="flex-row p-2 border-b"
                style={{
                  backgroundColor: theme.rowOdd,
                  borderColor: theme.subtleBorder,
                }}
              >
                <Text
                  className="flex-1 text-xs font-bold"
                  style={{ color: theme.textSecondary }}
                >
                  TX ID
                </Text>
                <Text
                  className="flex-1 text-xs font-bold"
                  style={{ color: theme.textSecondary }}
                >
                  Type
                </Text>
                <Text
                  className="flex-1 text-xs font-bold"
                  style={{ color: theme.textSecondary }}
                >
                  Date
                </Text>
                <Text
                  className="flex-1 text-xs font-bold text-right"
                  style={{ color: theme.textSecondary }}
                >
                  Allocated
                </Text>
              </View>
              {lineItems.map((item, idx) => (
                <View
                  key={item.id}
                  className="flex-row p-3 border-b items-center"
                  style={{
                    backgroundColor:
                      idx % 2 === 0 ? theme.rowEven : theme.rowOdd,
                    borderColor: theme.subtleBorder,
                  }}
                >
                  <Text
                    className="flex-1 text-xs"
                    style={{ color: theme.textPrimary }}
                  >
                    #{item.txId}
                  </Text>
                  <Text
                    className="flex-1 text-xs"
                    style={{ color: theme.textPrimary }}
                  >
                    {item.type}
                  </Text>
                  <Text
                    className="flex-1 text-xs"
                    style={{ color: theme.textPrimary }}
                  >
                    {item.date}
                  </Text>
                  <Text
                    className="flex-1 text-xs font-bold text-right"
                    style={{ color: theme.textPrimary }}
                  >
                    {item.allocated} kg
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* FOOTER BUTTONS */}
      <View className="flex-row gap-3 pt-2 -z-10">
        <TouchableOpacity
          onPress={() => router.push("/auditTrails")}
          className="flex-1 bg-gray-500 h-14 rounded-lg flex-row items-center justify-center gap-2"
        >
          <Text className="text-white font-bold text-lg">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          className="flex-[2] bg-blue-600 h-14 rounded-lg flex-row items-center justify-center gap-2"
        >
          <Check size={24} color="white" />
          <Text className="text-white font-bold text-lg">Submit Audit</Text>
        </TouchableOpacity>
      </View>

      {/* CONFIRMATION MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <View
              className="flex-row justify-between items-center mb-4 border-b pb-2"
              style={{ borderBottomColor: theme.border }}
            >
              <Text
                className="text-xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                Confirm Audit
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="gap-2 mb-6">
              <Text style={{ color: theme.textPrimary }}>
                Batch:{" "}
                <Text className="font-bold">
                  {scannedData.material} ({selectedBatchId})
                </Text>
              </Text>
              <Text style={{ color: theme.textPrimary }}>
                Status: <Text className="font-bold">{status}</Text>
              </Text>
              {isWeightInputVisible && (
                <Text className="text-blue-600 font-bold">
                  New Weight: {adjustedWeight} kg
                </Text>
              )}
              <Text
                className="italic text-xs mt-2"
                style={{ color: theme.textSecondary }}
              >
                This will create a permanent audit trail record.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleConfirmModal}
              className="bg-blue-600 p-4 rounded-lg items-center shadow-sm"
            >
              <Text className="text-white font-bold text-lg">
                Confirm & Save
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* GALLERY MODAL */}
      <Modal
        visible={galleryModalVisible}
        transparent={true}
        onRequestClose={() => setGalleryModalVisible(false)}
      >
        <View className="flex-1 bg-black justify-center items-center">
          <TouchableOpacity
            onPress={() => setGalleryModalVisible(false)}
            className="absolute top-10 right-5 z-50 p-2 bg-gray-800 rounded-full"
          >
            <X size={24} color="white" />
          </TouchableOpacity>

          <View className="h-[70%] w-full">
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
            >
              {evidenceImages.map((uri, index) => (
                <View key={index} style={{ width, alignItems: "center" }}>
                  <Image
                    source={{ uri }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <View className="absolute bottom-20 flex-row items-center gap-4">
            <Text className="text-white font-bold text-lg">
              {currentImageIndex + 1} / {evidenceImages.length}
            </Text>
            <TouchableOpacity
              onPress={removeImage}
              className="bg-red-600 p-3 rounded-full"
            >
              <Trash2 size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: "100%",
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    fontStyle: "italic",
  },
  textDisabled: {
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerOptionsContainer: {
    width: "80%",
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
    paddingBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 16,
  },
  modalContent: {
    width: "80%",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
