import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Check, ChevronDown, Plus, Trash2, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  auditTrails,
  inventory,
  inventoryTransactionItems,
  materials,
  transactionItems,
  transactions,
} from "../db/schema";

// --- REUSABLE PICKER (Custom Modal Implementation for Dark Mode Support) ---
const CustomPicker = ({
  selectedValue,
  onValueChange,
  placeholder,
  items,
  disabled,
  theme,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((i) => i.value === selectedValue);
  const displayLabel = selectedItem ? selectedItem.label : placeholder;

  return (
    <>
      <Pressable
        onPress={() => !disabled && setModalVisible(true)}
        style={[
          styles.pickerTrigger,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.pickerTriggerText,
            {
              color: selectedValue ? theme.textPrimary : theme.placeholder,
            },
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <ChevronDown size={20} color={theme.textSecondary} />
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
                      backgroundColor: theme.highlightBg, // Highlight selected
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
              ListEmptyComponent={
                <View className="p-4 items-center">
                  <Text style={{ color: theme.placeholder }}>
                    No items available
                  </Text>
                </View>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default function EditInventory() {
  const params = useLocalSearchParams();
  const batchIdParam = params.batchId;
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f9fafb", // Gray-50
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937", // Gray-800
    textSecondary: isDark ? "#A1A1AA" : "#4b5563", // Gray-600
    border: isDark ? "#333333" : "#e5e7eb", // Gray-200
    subtleBorder: isDark ? "#2C2C2C" : "#f3f4f6", // Gray-100
    inputBg: isDark ? "#2C2C2C" : "#f3f4f6", // Gray-100
    inputText: isDark ? "#FFFFFF" : "#374151", // Gray-700
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    highlightBg: isDark ? "#1e3a8a" : "#eff6ff", // Blue-900 : Blue-50
    headerBg: isDark ? "#0f0f0f" : "#1f2937", // Gray-800
    primary: "#2563eb",
    danger: "#ef4444",
    // Specific highlights for this screen
    highlightInputBg: isDark ? "#422006" : "#fef9c3", // Yellow-900/20 : Yellow-100
    highlightInputBorder: isDark ? "#a16207" : "#fde047", // Yellow-700 : Yellow-300
    highlightText: isDark ? "#60a5fa" : "#1e40af", // Blue-400 : Blue-800
  };

  // --- STATE ---
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSourcesLoading, setIsSourcesLoading] = useState(false);

  // Inventory Data
  const [inventoryRecord, setInventoryRecord] = useState(null);
  const [materialName, setMaterialName] = useState("");
  const [uom, setUom] = useState("");
  const [notes, setNotes] = useState("");
  const [netWeight, setNetWeight] = useState("0");

  // List State
  const [linkedItems, setLinkedItems] = useState([]);

  // Available Items for Picker
  const [availableSourceItems, setAvailableSourceItems] = useState([]);
  const [areSourcesLoaded, setAreSourcesLoaded] = useState(false);

  // Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [weightToAllocate, setWeightToAllocate] = useState("");
  const [maxAllocatable, setMaxAllocatable] = useState(0);

  // --- 1. LOAD BATCH DATA ---
  const loadBatchData = async () => {
    if (!batchIdParam) return;
    setIsPageLoading(true);

    try {
      // Fetch Batch Info
      const invResult = await db
        .select()
        .from(inventory)
        .where(eq(inventory.batchId, batchIdParam));
      if (invResult.length === 0) {
        Alert.alert("Error", "Batch not found");
        return router.back();
      }

      const inv = invResult[0];
      setInventoryRecord(inv);
      setNotes(inv.notes || "");
      setNetWeight((inv.netWeight || 0).toFixed(2));

      // Fetch Material Name & UOM
      const matResult = await db
        .select()
        .from(materials)
        .where(eq(materials.id, inv.materialId));
      const mat =
        matResult.length > 0 ? matResult[0] : { name: "Unknown", uom: "" };
      setMaterialName(mat.name);
      setUom(mat.uom);

      // Fetch Linked Items (LEDGER DATA)
      const links = await db
        .select({
          linkId: inventoryTransactionItems.id,
          txItemId: transactionItems.id,
          txId: transactions.id, // Transaction ID
          txType: transactions.type, // Transaction Type (Buying/Selling)
          date: transactions.date,
          allocated: inventoryTransactionItems.allocatedWeight,
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
        .where(eq(inventoryTransactionItems.inventoryId, inv.id))
        .orderBy(asc(transactions.date));

      setLinkedItems(links);
      setAreSourcesLoaded(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load batch data");
    } finally {
      setIsPageLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBatchData();
    }, [batchIdParam]),
  );

  // --- 2. LOAD SOURCES ---
  const loadAvailableSources = async () => {
    if (areSourcesLoaded || !inventoryRecord) return;
    setIsSourcesLoading(true);

    try {
      // Note: We currently only fetch "Buying" items to ADD to the batch.
      // If you wish to source from Adjustment-Gain as well, include it here.
      const recentItems = await db
        .select({
          itemId: transactionItems.id,
          txId: transactions.id,
          weight: transactionItems.weight,
          date: transactions.date,
        })
        .from(transactionItems)
        .leftJoin(
          transactions,
          eq(transactionItems.transactionId, transactions.id),
        )
        .where(
          and(
            eq(transactionItems.materialId, inventoryRecord.materialId),
            eq(transactions.type, "Buying"),
          ),
        )
        .orderBy(desc(transactionItems.id))
        .limit(500);

      if (recentItems.length === 0) {
        setAvailableSourceItems([]);
        setAreSourcesLoaded(true);
        setIsSourcesLoading(false);
        return;
      }

      const itemIds = recentItems.map((i) => i.itemId);

      const allocations = await db
        .select({
          itemId: inventoryTransactionItems.transactionItemId,
          allocated: inventoryTransactionItems.allocatedWeight,
        })
        .from(inventoryTransactionItems)
        .where(inArray(inventoryTransactionItems.transactionItemId, itemIds));

      const usageMap = {};
      allocations.forEach((row) => {
        usageMap[row.itemId] =
          (usageMap[row.itemId] || 0) + (row.allocated || 0);
      });

      const options = recentItems
        .map((item) => {
          const used = usageMap[item.itemId] || 0;
          const remaining = (item.weight || 0) - used;

          if (remaining <= 0.01) return null;

          return {
            label: `TX-${item.txId} (Line: ${item.itemId}) - Avail: ${remaining.toFixed(2)}kg`,
            value: item.itemId,
            remaining: remaining,
          };
        })
        .filter((item) => item !== null);

      setAvailableSourceItems(options);
      setAreSourcesLoaded(true);
    } catch (error) {
      console.error("Failed to load sources", error);
    } finally {
      setIsSourcesLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalVisible(true);
    setTimeout(() => loadAvailableSources(), 100);
  };

  const handleAddLineItem = async () => {
    if (!selectedSourceId || !weightToAllocate)
      return Alert.alert("Error", "Missing fields");
    const val = parseFloat(weightToAllocate);
    if (isNaN(val) || val <= 0 || val > maxAllocatable + 0.001)
      return Alert.alert("Error", "Invalid weight");

    // PREPARE DATA FOR AUDIT TRAIL
    const currentWeight = parseFloat(inventoryRecord.netWeight || 0);
    const newWeight = currentWeight + val;

    // --- FIX: Use Local System Time ---
    const nowObj = new Date();
    const year = nowObj.getFullYear();
    const month = String(nowObj.getMonth() + 1).padStart(2, "0");
    const day = String(nowObj.getDate()).padStart(2, "0");
    const now = `${year}-${month}-${day}`;
    // ----------------------------------

    try {
      await db.transaction(async (tx) => {
        // 1. Create Link
        await tx.insert(inventoryTransactionItems).values({
          inventoryId: inventoryRecord.id,
          transactionItemId: selectedSourceId,
          allocatedWeight: val,
        });

        // 2. Update Inventory Batch Weight
        await tx
          .update(inventory)
          .set({
            netWeight: sql`${inventory.netWeight} + ${val}`,
            status: "In Stock",
          })
          .where(eq(inventory.id, inventoryRecord.id));

        // 3. Create Audit Trail Entry
        await tx.insert(auditTrails).values({
          inventoryId: inventoryRecord.id,
          action: "Batch Update",
          notes: `Added ${val}kg from Transaction Item #${selectedSourceId}`,
          date: now, // Uses local date
          previousWeight: currentWeight,
          newWeight: newWeight,
        });
      });

      setIsAddModalVisible(false);
      setWeightToAllocate("");
      loadBatchData();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDeleteItem = async (linkId, allocatedAmount) => {
    try {
      const currentWeight = parseFloat(inventoryRecord.netWeight || 0);
      const newWeight = Math.max(0, currentWeight - allocatedAmount);
      const newStatus = newWeight > 0.001 ? "In Stock" : "Sold Out";

      await db.transaction(async (tx) => {
        await tx
          .delete(inventoryTransactionItems)
          .where(eq(inventoryTransactionItems.id, linkId));

        await tx
          .update(inventory)
          .set({
            netWeight: newWeight,
            status: newStatus,
          })
          .where(eq(inventory.id, inventoryRecord.id));
      });

      loadBatchData();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const confirmDelete = (linkId, amount) => {
    Alert.alert("Remove Item", "This will reduce the batch weight.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => handleDeleteItem(linkId, amount),
      },
    ]);
  };

  // --- SOFT DELETE BATCH LOGIC ---
  const handleDeleteBatch = async () => {
    if (!inventoryRecord) return;

    try {
      // 1. Check Constraint: Are there linked transaction items?
      const dependencies = await db
        .select()
        .from(inventoryTransactionItems)
        .where(eq(inventoryTransactionItems.inventoryId, inventoryRecord.id));

      if (dependencies.length > 0) {
        Alert.alert(
          "Cannot Delete Batch",
          "This batch still has active weight allocations. Please remove all line items first to free up the material source.",
        );
        return;
      }

      // 2. Confirm Soft Deletion
      Alert.alert(
        "Delete Batch",
        "Are you sure you want to delete this batch? It will be removed from the active inventory list, but its history and audit trails will be preserved.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const nowObj = new Date();
              const year = nowObj.getFullYear();
              const month = String(nowObj.getMonth() + 1).padStart(2, "0");
              const day = String(nowObj.getDate()).padStart(2, "0");
              const now = `${year}-${month}-${day}`;
              const currentWeight = parseFloat(inventoryRecord.netWeight || 0);

              try {
                await db.transaction(async (tx) => {
                  await tx
                    .update(inventory)
                    .set({
                      status: "Deleted",
                      netWeight: 0,
                      notes: (inventoryRecord.notes || "") + " [DELETED]",
                    })
                    .where(eq(inventory.id, inventoryRecord.id));

                  await tx.insert(auditTrails).values({
                    inventoryId: inventoryRecord.id,
                    action: "Deleted",
                    notes: "Batch soft deleted by user. History preserved.",
                    date: now,
                    previousWeight: currentWeight,
                    newWeight: 0,
                  });
                });

                router.replace("/inventory");
              } catch (error) {
                Alert.alert(
                  "Error",
                  "Failed to delete batch: " + error.message,
                );
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred: " + error.message);
    }
  };

  const handleSubmit = async () => {
    router.back();
  };

  const handleSourceChange = (val) => {
    setSelectedSourceId(val);
    const item = availableSourceItems.find((i) => i.value === val);
    if (item) {
      setMaxAllocatable(item.remaining);
      setWeightToAllocate(item.remaining.toString());
    }
  };

  if (isPageLoading)
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );

  return (
    <View
      className="flex-1 px-4 py-4 justify-start gap-4"
      style={{ backgroundColor: theme.background }}
    >
      {/* SECTION 1: HEADER */}
      <View
        className="rounded-md p-4 shadow-sm border"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <Text
            className="text-lg font-bold"
            style={{ color: theme.textPrimary }}
          >
            Inventory Batch Details
          </Text>
        </View>

        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text
              className="font-bold mb-1 text-xs"
              style={{ color: theme.textSecondary }}
            >
              Batch ID
            </Text>
            <TextInput
              className="rounded-md px-3 h-12 border text-sm"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.border,
                color: theme.textSecondary,
              }}
              value={inventoryRecord?.batchId}
              editable={false}
            />
          </View>
          <View className="flex-1">
            <Text
              className="font-bold mb-1 text-xs"
              style={{ color: theme.textSecondary }}
            >
              Material
            </Text>
            <View
              className="h-12 rounded-md border justify-center px-3"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.border,
              }}
            >
              <Text
                className="text-sm"
                style={{ color: theme.textSecondary }}
                numberOfLines={1}
              >
                {materialName}
              </Text>
            </View>
          </View>

          <View className="flex-1">
            <Text
              className="font-bold mb-1 text-xs"
              style={{ color: theme.textSecondary }}
            >
              Net Weight
            </Text>
            <TextInput
              className="rounded-md px-3 h-12 border text-sm font-extrabold"
              style={{
                backgroundColor: theme.highlightInputBg,
                borderColor: theme.highlightInputBorder,
                color: theme.highlightText,
              }}
              value={`${netWeight} ${uom}`}
              editable={false}
            />
          </View>
        </View>
      </View>

      {/* SECTION 2: ITEMS LEDGER */}
      <View
        className="flex-1 rounded-md border overflow-hidden"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        {/* TABLE HEADER */}
        <View
          className="flex-row p-3 items-center"
          style={{ backgroundColor: theme.headerBg }}
        >
          <Text className="flex-0.5 font-bold text-white text-center text-xs">
            ID
          </Text>
          <Text className="flex-1 font-bold text-white text-center text-xs">
            Type
          </Text>
          <Text className="flex-0.5 font-bold text-white text-center text-xs">
            Line
          </Text>
          <Text className="flex-1 font-bold text-white text-center text-xs">
            Date
          </Text>
          <Text className="flex-1 font-bold text-white text-center text-xs">
            Weight
          </Text>
          <TouchableOpacity
            onPress={handleOpenAddModal}
            className="w-8 items-center justify-center bg-blue-600 rounded-sm h-6"
          >
            <Plus size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* TABLE BODY */}
        <ScrollView className="flex-1">
          {linkedItems.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="italic" style={{ color: theme.placeholder }}>
                No items linked.
              </Text>
            </View>
          ) : (
            linkedItems.map((item, index) => {
              // --- CHANGED LOGIC HERE ---
              // Determine if this transaction ADDS (incoming) or REMOVES (outgoing) inventory
              const isIncoming = ["Buying", "Adjustment-Gain"].includes(
                item.txType || "",
              );

              const weightColor = isIncoming ? "#16a34a" : "#dc2626"; // Green (+) : Red (-)
              const weightPrefix = isIncoming ? "+" : "-";

              return (
                <View
                  key={item.linkId}
                  className="flex-row items-center p-3 border-b"
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? theme.rowEven : theme.rowOdd,
                    borderColor: theme.subtleBorder,
                  }}
                >
                  {/* Transaction ID */}
                  <Text
                    className="flex-0.5 text-center text-xs font-medium"
                    style={{ color: theme.textPrimary }}
                  >
                    {item.txId}
                  </Text>

                  {/* Transaction Type */}
                  <Text
                    className="flex-1 text-center text-xs font-bold"
                    style={{
                      color: weightColor,
                    }}
                  >
                    {item.txType}
                  </Text>

                  {/* Line ID (Tx Item ID) */}
                  <Text
                    className="flex-0.5 text-center text-xs"
                    style={{ color: theme.textSecondary }}
                  >
                    {item.txItemId}
                  </Text>

                  {/* Date */}
                  <Text
                    className="flex-1 text-center text-xs"
                    style={{ color: theme.textSecondary }}
                  >
                    {item.date}
                  </Text>

                  {/* Weight (Ledger Style) */}
                  <Text
                    className="flex-1 text-center text-xs font-bold"
                    style={{ color: weightColor }}
                  >
                    {weightPrefix} {item.allocated}
                  </Text>

                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => confirmDelete(item.linkId, item.allocated)}
                    className="w-8 items-center justify-center"
                  >
                    <Trash2 size={16} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* SECTION 3: ACTIONS */}
      <View className="h-16 flex-row gap-4 mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-gray-500 flex-1 justify-center items-center rounded-md"
        >
          <Text className="font-semibold text-xl text-white">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteBatch}
          className="bg-red-600 flex-1 justify-center items-center rounded-md"
        >
          <Text className="font-semibold text-xl text-white">Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-green-600 flex-1 justify-center items-center rounded-md"
        >
          <Text className="font-semibold text-xl text-white">Done</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isAddModalVisible}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsAddModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.modalContent, { backgroundColor: theme.card }]}
          >
            <Pressable onPress={() => {}}>
              <View
                className="flex-row justify-between items-center mb-4 border-b pb-2"
                style={{ borderBottomColor: theme.border }}
              >
                <Text
                  className="text-lg font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  Add Transaction Item
                </Text>
                <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                  <X size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text
                className="mb-4 text-xs"
                style={{ color: theme.textSecondary }}
              >
                Select source of type{" "}
                <Text
                  className="font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {materialName}
                </Text>
                .
              </Text>

              <View className="mb-4">
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textPrimary }}
                >
                  Source Item
                </Text>
                <View className="h-12 justify-center">
                  {isSourcesLoading ? (
                    <View
                      className="flex-row items-center justify-center h-full rounded-md border"
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                      }}
                    >
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text
                        className="ml-2"
                        style={{ color: theme.textSecondary }}
                      >
                        Finding items...
                      </Text>
                    </View>
                  ) : (
                    <CustomPicker
                      selectedValue={selectedSourceId}
                      onValueChange={handleSourceChange}
                      placeholder={
                        availableSourceItems.length > 0
                          ? "Select Source Item"
                          : "No items available"
                      }
                      items={availableSourceItems}
                      disabled={availableSourceItems.length === 0}
                      theme={theme}
                    />
                  )}
                </View>
              </View>

              <View className="mb-6">
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textPrimary }}
                >
                  Allocate Weight ({uom})
                </Text>
                <Text
                  className="text-xs mb-1"
                  style={{ color: theme.placeholder }}
                >
                  Max: {maxAllocatable.toFixed(2)} {uom}
                </Text>
                <TextInput
                  className="rounded-md p-3 text-lg border text-center font-bold"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.primary,
                  }}
                  keyboardType="numeric"
                  value={weightToAllocate}
                  onChangeText={setWeightToAllocate}
                  placeholder="0.00"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setIsAddModalVisible(false)}
                  className="flex-1 p-3 rounded-md items-center"
                  style={{ backgroundColor: theme.inputBg }}
                >
                  <Text
                    className="font-bold"
                    style={{ color: theme.textSecondary }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddLineItem}
                  className="flex-1 bg-blue-600 p-3 rounded-md items-center"
                >
                  <Text className="font-bold text-white">Add</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
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
    width: "100%",
  },
  pickerTriggerText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // Custom Picker Styles
  pickerOptionsContainer: {
    width: "80%", // Wider on Edit Screen for transaction details
    maxHeight: "60%",
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
    fontSize: 14,
  },
});
