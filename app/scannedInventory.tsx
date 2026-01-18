import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Camera, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
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
import { db } from "./_layout";

// --- REUSABLE COMPONENT: Standard Picker (Kept for Status) ---
const CustomPicker = ({
  selectedValue,
  onValueChange,
  placeholder,
  items,
  enabled = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const truncate = (str, n) =>
    str?.length > n ? str.substr(0, n - 1) + "..." : str;

  return (
    <View
      style={[
        styles.pickerContainer,
        isFocused && styles.pickerFocused,
        !enabled && styles.pickerDisabled,
      ]}
    >
      <View style={styles.visualContainer}>
        <Text
          style={[
            styles.pickerText,
            !selectedValue && styles.placeholderText,
            !enabled && styles.textDisabled,
          ]}
          numberOfLines={1}
        >
          {selectedValue
            ? items.find((i) => i.value === selectedValue)?.label ||
              selectedValue
            : placeholder}
        </Text>
        {enabled && (
          <View style={styles.arrowContainer}>
            <View
              style={[styles.roundedArrow, isFocused && styles.arrowOpen]}
            />
          </View>
        )}
      </View>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(v) => {
          if (enabled) {
            onValueChange(v);
            setIsFocused(false);
          }
        }}
        onFocus={() => enabled && setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.invisiblePicker}
        enabled={enabled}
        mode="dropdown"
      >
        <Picker.Item label={placeholder} value={null} enabled={false} />
        {items.map((item, index) => (
          <Picker.Item
            key={index}
            label={truncate(item.label, 35)}
            value={item.value}
          />
        ))}
      </Picker>
    </View>
  );
};

export default function ScannedInventory() {
  // Get params
  const params = useLocalSearchParams();
  const passedBatchId = params.batchId;

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

  // Changed to Array for Multiple Images
  const [evidenceImages, setEvidenceImages] = useState([]);

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
        label: `${b.batchId} - ${b.materialName}`, // Combined for searchability
        displayLabel: b.batchId,
        value: b.id,
        ...b,
      }));

      setInventoryBatches(formattedBatches);
      setFilteredBatches(formattedBatches);

      // AUTO SELECT if passedBatchId exists
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

  // Handle Batch Selection (Updated for Searchable Dropdown)
  const handleBatchChange = (batchItem) => {
    setSelectedBatchId(batchItem.value);
    setBatchSearchQuery(batchItem.label); // Set input to selected label
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

  // Handle Numeric Input Only
  const handleNumericInput = (text, setter) => {
    if (text === "" || /^\d*\.?\d*$/.test(text)) {
      setter(text);
    }
  };

  // Take Photo (Multiple)
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
      // Append new image to array
      setEvidenceImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove) => {
    setEvidenceImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
      const today = new Date().toISOString().split("T")[0];
      const currentWeight = parseFloat(scannedData.netWeight);
      const newWeightVal =
        status === "Adjusted" ? parseFloat(adjustedWeight) : null;

      // Serialize images array to string for DB
      const evidenceJson =
        evidenceImages.length > 0 ? JSON.stringify(evidenceImages) : null;

      await db.transaction(async (tx) => {
        // 1. Create Audit Record
        await tx.insert(auditTrails).values({
          inventoryId: selectedBatchId,
          action: status,
          notes: notes,
          date: today,
          evidenceImageUri: evidenceJson, // Saving as JSON string
          previousWeight: status === "Adjusted" ? currentWeight : null,
          newWeight: newWeightVal,
        });

        // 2. Handle Adjustments
        if (status === "Adjusted" && newWeightVal !== null) {
          // Update Physical Inventory Weight
          await tx
            .update(inventory)
            .set({ netWeight: newWeightVal })
            .where(eq(inventory.id, selectedBatchId));

          const weightDiff = currentWeight - newWeightVal;

          if (weightDiff !== 0) {
            // Determine Type: Loss (Positive diff) or Gain (Negative diff)
            const isLoss = weightDiff > 0;
            const type = isLoss ? "Adjustment-Loss" : "Adjustment-Gain";
            const absWeight = Math.abs(weightDiff);

            // Create System Transaction
            const txRes = await tx
              .insert(transactions)
              .values({
                type: type,
                date: today,
                status: "Completed",
                totalAmount: 0, // No financial exchange for adjustments usually
              })
              .returning();
            const newTxId = txRes[0].id;

            // Create Transaction Item
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

            // Link to Inventory (Crucial for FIFO!)
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
      {/* HEADER ROW with SEARCHABLE DROPDOWN */}
      <View className="items-center justify-center z-50">
        <Text className="text-gray-500 font-bold mb-2 uppercase tracking-widest">
          Scanned Item Details
        </Text>
        <View className="w-[80%] relative z-50">
          <View className="flex-row items-center bg-white border-2 border-gray-300 rounded-md h-12 px-2">
            <TextInput
              value={batchSearchQuery}
              onChangeText={(text) => {
                setBatchSearchQuery(text);
                setIsBatchDropdownOpen(true);
                setSelectedBatchId(null); // Clear selection if typing new
              }}
              onFocus={() => setIsBatchDropdownOpen(true)}
              placeholder="Type to filter Batch ID..."
              className="flex-1 text-base text-black h-full"
            />
            {isBatchDropdownOpen && (
              <TouchableOpacity onPress={() => setIsBatchDropdownOpen(false)}>
                <View style={[styles.roundedArrow, styles.arrowOpen]} />
              </TouchableOpacity>
            )}
            {!isBatchDropdownOpen && (
              <TouchableOpacity onPress={() => setIsBatchDropdownOpen(true)}>
                <View style={styles.roundedArrow} />
              </TouchableOpacity>
            )}
          </View>

          {/* ABSOLUTE DROPDOWN LIST */}
          {isBatchDropdownOpen && (
            <View className="absolute top-12 left-0 right-0 bg-white border border-gray-300 rounded-b-md max-h-48 shadow-lg z-50 elevation-5">
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

        {/* SHOW ADJUST INPUT ONLY IF STATUS IS ADJUSTED */}
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

      {/* ROW 4: Photo Evidence & Notes (BIGGER) */}
      <View className="flex-row gap-4 -z-10">
        <View className="flex-1">
          <Text className="text-gray-700 font-bold mb-1">
            Evidence ({evidenceImages.length})
          </Text>

          <View className="h-48 border-2 border-dashed border-gray-300 bg-gray-50 rounded-md p-2">
            {/* Camera Button */}
            <TouchableOpacity
              onPress={handleTakePhoto}
              className="flex-row items-center justify-center p-2 bg-white border border-gray-300 rounded mb-2 shadow-sm"
            >
              <Camera size={20} color="#4b5563" />
              <Text className="text-gray-700 font-bold ml-2 text-xs">
                Add Photo
              </Text>
            </TouchableOpacity>

            {/* Image Gallery */}
            <ScrollView contentContainerStyle={{ gap: 8 }}>
              {evidenceImages.map((uri, idx) => (
                <View key={idx} className="relative w-full h-32 mb-2">
                  <Image
                    source={{ uri: uri }}
                    className="w-full h-full rounded-md"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                  >
                    <X size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              {evidenceImages.length === 0 && (
                <View className="items-center justify-center h-20">
                  <Text className="text-gray-400 text-xs italic">
                    No photos added
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        <View className="flex-[1.5]">
          <Text className="text-black font-bold mb-1">Scan Notes</Text>
          {/* Height h-48 */}
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

      {/* TABLE SECTION: Real Data (FLEX-1 to fill space, SCROLLABLE inside) */}
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
  pickerContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 6,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    width: "100%",
    borderWidth: 2,
    borderColor: "transparent",
  },
  pickerDisabled: {
    backgroundColor: "#e5e7eb",
    borderColor: "#d1d5db",
    borderWidth: 1,
  },
  pickerFocused: { borderColor: "#F2C94C" },
  visualContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: "100%",
    width: "100%",
  },
  pickerText: { fontSize: 16, color: "black", flex: 1, marginRight: 10 },
  textDisabled: { color: "#6b7280" },
  placeholderText: { color: "#9ca3af" },
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 20,
    height: 20,
  },
  roundedArrow: {
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "black",
    transform: [{ rotate: "45deg" }],
    marginTop: -4,
    borderRadius: 2,
  },
  arrowOpen: { transform: [{ rotate: "225deg" }], marginTop: 4 },
  invisiblePicker: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    width: "100%",
    height: "100%",
  },
});
