import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Camera, Eye, Plus, Trash2, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { and, asc, eq, gt, sum } from "drizzle-orm";
import {
  auditTrails,
  inventory,
  inventoryTransactionItems,
  materials,
  transactionItems,
  transactions,
} from "../db/schema";
import { db } from "./_layout";

const SummaryPicker = ({
  selectedValue,
  onValueChange,
  placeholder,
  items,
}) => (
  <View style={styles.pickerContainer}>
    <View style={styles.visualContainer}>
      <Text
        style={[styles.pickerText, !selectedValue && styles.placeholderText]}
        numberOfLines={1}
      >
        {selectedValue || placeholder}
      </Text>
      <View style={styles.arrowContainer}>
        <View style={styles.roundedArrow} />
      </View>
    </View>
    <Picker
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      style={styles.invisiblePicker}
    >
      <Picker.Item label={placeholder} value={null} enabled={false} />
      {items.map((i, idx) => (
        <Picker.Item key={idx} label={i} value={i} />
      ))}
    </Picker>
  </View>
);

export default function TransactionSummary() {
  const params = useLocalSearchParams();
  const transactionId = params.transactionId
    ? Number(params.transactionId)
    : null;

  // Data State
  const [lineItems, setLineItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  // Header State
  const [transactionType, setTransactionType] = useState();
  const [paymentMethod, setPaymentMethod] = useState();
  const [clientName, setClientName] = useState("");
  const [clientAffiliation, setClientAffiliation] = useState("");
  const [driverName, setDriverName] = useState("");
  const [truckPlate, setTruckPlate] = useState("");
  const [truckWeight, setTruckWeight] = useState("");
  const [licenseImage, setLicenseImage] = useState(null);

  // Modals
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);

  // Inputs
  const [paidAmountInput, setPaidAmountInput] = useState("");

  // Add Item Modal Inputs
  const [materialsList, setMaterialsList] = useState([]);
  const [newItemMaterialId, setNewItemMaterialId] = useState(null);
  const [newItemWeight, setNewItemWeight] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemSubtotal, setNewItemSubtotal] = useState("0.00");
  const [availableStock, setAvailableStock] = useState(0);

  const loadMaterials = async () => {
    const data = await db.select().from(materials);
    setMaterialsList(
      data.map((m) => ({ label: m.name, value: m.id, uom: m.uom })),
    );
  };

  const loadTransactionData = async () => {
    // If Editing an existing transaction
    if (transactionId) {
      const txHeader = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));
      if (txHeader.length > 0) {
        const h = txHeader[0];
        setTransactionType(h.type);
        setPaymentMethod(h.paymentMethod);
        setClientName(h.clientName || "");
        setClientAffiliation(h.clientAffiliation || "");
        setDriverName(h.driverName || "");
        setTruckPlate(h.truckPlate || "");
        setTruckWeight(h.truckWeight ? String(h.truckWeight) : "");
        setLicenseImage(h.licenseImageUri || null);
      }
      const items = await db
        .select({
          id: transactionItems.id,
          material: materials.name,
          materialId: materials.id,
          weight: transactionItems.weight,
          price: transactionItems.price,
          subtotal: transactionItems.subtotal,
          uom: materials.uom,
        })
        .from(transactionItems)
        .leftJoin(materials, eq(transactionItems.materialId, materials.id))
        .where(eq(transactionItems.transactionId, transactionId));

      setLineItems(items);
      setGrandTotal(items.reduce((sum, item) => sum + item.subtotal, 0));
    } else {
      // New Transaction - Reset
      setLineItems([]);
      setGrandTotal(0);
      setTransactionType(null);
      setPaymentMethod(null);
      setClientName("");
      setClientAffiliation("");
      setDriverName("");
      setTruckPlate("");
      setTruckWeight("");
      setLicenseImage(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMaterials();
      loadTransactionData();
    }, [transactionId]),
  );

  // --- ACTIONS ---

  const updateHeader = async (field, value) => {
    if (field === "type") setTransactionType(value);
    if (field === "payment") setPaymentMethod(value);

    if (transactionId) {
      try {
        await db
          .update(transactions)
          .set({ [field === "type" ? "type" : "paymentMethod"]: value })
          .where(eq(transactions.id, transactionId));
      } catch (e) {
        console.error("Persist failed", e);
      }
    }
  };

  const takeLicensePhoto = async () => {
    const res = await ImagePicker.requestCameraPermissionsAsync();
    if (!res.granted) {
      Alert.alert("Permission Required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) setLicenseImage(result.assets[0].uri);
  };

  // --- ITEM MANAGEMENT ---

  // 1. Fetch Stock when Material changes in Modal
  useEffect(() => {
    const checkStock = async () => {
      if (
        addItemModalVisible &&
        newItemMaterialId &&
        transactionType === "Selling"
      ) {
        try {
          const result = await db
            .select({ total: sum(inventory.netWeight) })
            .from(inventory)
            .where(
              and(
                eq(inventory.materialId, newItemMaterialId),
                eq(inventory.status, "In Stock"),
                gt(inventory.netWeight, 0),
              ),
            );
          setAvailableStock(result[0]?.total || 0);
        } catch (e) {
          console.error("Stock check failed", e);
          setAvailableStock(0);
        }
      } else {
        setAvailableStock(0);
      }
    };
    checkStock();
  }, [addItemModalVisible, newItemMaterialId, transactionType]);

  // 2. Auto-Calculate Subtotal
  useEffect(() => {
    const w = parseFloat(newItemWeight) || 0;
    const p = parseFloat(newItemPrice) || 0;
    setNewItemSubtotal((w * p).toFixed(2));
  }, [newItemWeight, newItemPrice]);

  const handleAddItem = () => {
    if (!transactionType || !paymentMethod) {
      Alert.alert("Required", "Select Type and Payment Method first.");
      return;
    }

    // Open Local Modal
    setNewItemMaterialId(null);
    setNewItemWeight("");
    setNewItemPrice("");
    setNewItemSubtotal("0.00");
    setAddItemModalVisible(true);
  };

  const saveNewItem = async () => {
    if (!newItemMaterialId || !newItemWeight || !newItemPrice) {
      Alert.alert("Error", "Fill all fields");
      return;
    }
    const w = parseFloat(newItemWeight);
    const p = parseFloat(newItemPrice);
    const sub = w * p;

    // VALIDATION: Check Stock if Selling
    if (transactionType === "Selling" && w > availableStock) {
      Alert.alert(
        "Insufficient Stock",
        `You requested ${w} kg but only ${availableStock} kg is available.`,
      );
      return;
    }

    const mat = materialsList.find((m) => m.value === newItemMaterialId);

    if (transactionId) {
      // EDIT MODE: Insert directly to DB
      await db.insert(transactionItems).values({
        transactionId,
        materialId: newItemMaterialId,
        weight: w,
        price: p,
        subtotal: sub,
      });
      loadTransactionData();
    } else {
      // NEW MODE: Add to local state
      const newItem = {
        id: Date.now(), // Temp ID
        material: mat.label,
        materialId: newItemMaterialId,
        weight: w,
        price: p,
        subtotal: sub,
        uom: mat.uom,
      };
      const newList = [...lineItems, newItem];
      setLineItems(newList);
      setGrandTotal(newList.reduce((s, i) => s + i.subtotal, 0));
    }
    setAddItemModalVisible(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (transactionId) {
      await db.delete(transactionItems).where(eq(transactionItems.id, itemId));
      loadTransactionData();
    } else {
      const newList = lineItems.filter((i) => i.id !== itemId);
      setLineItems(newList);
      setGrandTotal(newList.reduce((s, i) => s + i.subtotal, 0));
    }
  };

  // --- FINISH LOGIC ---

  const handleDone = () => {
    if (!transactionType || !paymentMethod) {
      Alert.alert("Error", "Select Type & Payment");
      return;
    }
    if (!clientName.trim()) {
      Alert.alert("Error", "Client Name required");
      return;
    }
    if (
      transactionType === "Selling" &&
      (!driverName || !truckPlate || !truckWeight)
    ) {
      Alert.alert("Error", "Logistics required");
      return;
    }

    setPaidAmountInput("");
    setFinishModalVisible(true);
  };

  const confirmFinish = async () => {
    try {
      const finalPaidAmount = parseFloat(paidAmountInput) || 0;

      // --- FIX: Use Local Date instead of ISO (UTC) ---
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const localDate = `${year}-${month}-${day}`;
      // ------------------------------------------------

      let finalTxId = transactionId;

      if (transactionId) {
        // EDIT MODE: Update existing
        await db
          .update(transactions)
          .set({
            totalAmount: grandTotal,
            paidAmount: finalPaidAmount,
            status: "Completed",
            clientName,
            clientAffiliation,
            driverName,
            truckPlate,
            truckWeight: parseFloat(truckWeight),
            licenseImageUri: licenseImage,
          })
          .where(eq(transactions.id, transactionId));
      } else {
        // NEW MODE: Create Transaction
        const result = await db
          .insert(transactions)
          .values({
            type: transactionType,
            paymentMethod,
            totalAmount: grandTotal,
            paidAmount: finalPaidAmount,
            status: "Completed",
            date: localDate, // Uses local date
            clientName,
            clientAffiliation: clientAffiliation || null,
            driverName: transactionType === "Selling" ? driverName : null,
            truckPlate: transactionType === "Selling" ? truckPlate : null,
            truckWeight:
              transactionType === "Selling" ? parseFloat(truckWeight) : null,
            licenseImageUri:
              transactionType === "Selling" ? licenseImage : null,
          })
          .returning();

        finalTxId = result[0].id;

        // PROCESS ITEMS
        for (const item of lineItems) {
          // 1. Insert Transaction Item
          const itemRes = await db
            .insert(transactionItems)
            .values({
              transactionId: finalTxId,
              materialId: item.materialId,
              weight: item.weight,
              price: item.price,
              subtotal: item.subtotal,
            })
            .returning();
          const newItemId = itemRes[0].id;

          // 2. Handle Selling Inventory Logic (FIFO)
          // Note: Buying logic for creating inventory batches has been removed per request.
          if (transactionType === "Selling") {
            let remainingQty = item.weight;

            // Get available batches sorted by date (FIFO)
            const batches = await db
              .select()
              .from(inventory)
              .where(
                and(
                  eq(inventory.materialId, item.materialId),
                  eq(inventory.status, "In Stock"),
                  gt(inventory.netWeight, 0),
                ),
              )
              .orderBy(asc(inventory.date));

            for (const batch of batches) {
              if (remainingQty <= 0) break;

              const take = Math.min(remainingQty, batch.netWeight);
              const newWeight = batch.netWeight - take;

              // Update Batch
              await db
                .update(inventory)
                .set({
                  netWeight: newWeight,
                  status: newWeight === 0 ? "Depleted" : "In Stock",
                })
                .where(eq(inventory.id, batch.id));

              // Link to Transaction Item
              await db.insert(inventoryTransactionItems).values({
                inventoryId: batch.id,
                transactionItemId: newItemId,
                allocatedWeight: take,
              });

              // Audit Trail (Stock Out)
              await db.insert(auditTrails).values({
                inventoryId: batch.id,
                action: "Stock Out",
                notes: `Sold in Tx #${finalTxId}`,
                date: localDate, // Uses local date
                previousWeight: batch.netWeight,
                newWeight: newWeight,
              });

              remainingQty -= take;
            }
          }
        }
      }

      setFinishModalVisible(false);
      router.replace({
        pathname: "/transactionDetailed",
        params: { transactionId: finalTxId },
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View className="flex-1 bg-gray-50 p-3 gap-3">
        {/* HEADER INPUTS */}
        <View className="bg-white p-3 rounded-lg border border-gray-200 gap-3 shadow-sm">
          <View className="flex-row gap-3">
            <View className="flex-[0.8]">
              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Type
              </Text>
              <SummaryPicker
                selectedValue={transactionType}
                onValueChange={(v) => updateHeader("type", v)}
                placeholder="Type"
                items={["Buying", "Selling"]}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Payment Method
              </Text>
              <SummaryPicker
                selectedValue={paymentMethod}
                onValueChange={(v) => updateHeader("payment", v)}
                placeholder="Method"
                items={["Cash", "G-Cash", "Bank Transfer"]}
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Client Name
              </Text>
              <TextInput
                placeholder="Full Name"
                value={clientName}
                onChangeText={setClientName}
                className="border border-gray-300 rounded px-2 h-12 bg-white text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Affiliation
              </Text>
              <TextInput
                placeholder="Company (Opt)"
                value={clientAffiliation}
                onChangeText={setClientAffiliation}
                className="border border-gray-300 rounded px-2 h-12 bg-white text-base"
              />
            </View>
          </View>
          {transactionType === "Selling" && (
            <>
              <View className="flex-row gap-3 pt-2 border-t border-gray-100 mt-1">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-orange-600 mb-1 uppercase">
                    Driver
                  </Text>
                  <TextInput
                    placeholder="Driver Name"
                    value={driverName}
                    onChangeText={setDriverName}
                    className="border border-orange-200 rounded px-2 h-12 bg-orange-50 text-base"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-orange-600 mb-1 uppercase">
                    Plate #
                  </Text>
                  <TextInput
                    placeholder="ABC-123"
                    value={truckPlate}
                    onChangeText={setTruckPlate}
                    className="border border-orange-200 rounded px-2 h-12 bg-orange-50 text-base"
                  />
                </View>
              </View>
              <View className="flex-row gap-3 items-end">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-orange-600 mb-1 uppercase">
                    Truck Weight (kg)
                  </Text>
                  <TextInput
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={truckWeight}
                    onChangeText={setTruckWeight}
                    className="border border-orange-200 rounded px-2 h-12 bg-orange-50 text-base"
                  />
                </View>
                <View className="flex-1 flex-row gap-2">
                  <Pressable
                    onPress={takeLicensePhoto}
                    className={`flex-1 h-12 rounded items-center justify-center flex-row gap-1 border ${licenseImage ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-300"}`}
                  >
                    <Camera size={18} color="black" />
                    <Text className="text-xs font-bold">
                      {licenseImage ? "Retake" : "License"}
                    </Text>
                  </Pressable>
                  {licenseImage && (
                    <Pressable
                      onPress={() => setImageModalVisible(true)}
                      className="w-12 h-12 bg-blue-100 border border-blue-300 rounded items-center justify-center"
                    >
                      <Eye size={20} color="#2563eb" />
                    </Pressable>
                  )}
                </View>
              </View>
            </>
          )}
        </View>

        {/* ITEMS LIST */}
        <View className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <View className="flex-row bg-gray-100 p-2 border-b border-gray-200 justify-between items-center">
            <Text className="font-bold text-gray-700">Items List</Text>
            <View className="items-end">
              <Text className="text-xs text-gray-500">Total Amount</Text>
              <Text className="font-bold text-blue-700 text-lg">
                ₱{grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>
          <View className="flex-row bg-gray-800 p-2 items-center">
            <Text className="flex-[2] font-bold text-white text-xs">
              Material
            </Text>
            <Text className="flex-1 font-bold text-white text-center text-xs">
              Wt
            </Text>
            <Text className="flex-1 font-bold text-white text-center text-xs">
              Price
            </Text>
            <Text className="flex-1 font-bold text-white text-center text-xs">
              Sub
            </Text>
            <Text className="w-16 font-bold text-white text-center text-xs">
              Act
            </Text>
          </View>
          <FlatList
            data={lineItems}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 60 }}
            renderItem={({ item, index }) => (
              <View
                className={`flex-row items-center p-3 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <Text
                  className="flex-[2] text-gray-800 text-sm font-medium"
                  numberOfLines={1}
                >
                  {item.material}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-sm">
                  {item.weight} {item.uom}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-sm">
                  ₱{item.price}
                </Text>
                <Text className="flex-1 text-blue-700 text-center text-sm font-bold">
                  ₱{item.subtotal.toFixed(0)}
                </Text>
                <View className="w-16 flex-row justify-center gap-2">
                  <Pressable onPress={() => handleDeleteItem(item.id)}>
                    <Trash2 size={18} color="#dc2626" />
                  </Pressable>
                </View>
              </View>
            )}
          />
        </View>

        {/* FOOTER BUTTONS */}
        <View className="flex-row gap-2 h-14">
          <Pressable
            onPress={handleAddItem}
            className="flex-1 bg-blue-600 rounded-lg flex-row items-center justify-center gap-2"
          >
            <Plus size={22} color="white" />
            <Text className="text-white font-bold text-lg">Add Item</Text>
          </Pressable>
          <Pressable
            onPress={handleDone}
            className="flex-1 bg-green-600 rounded-lg items-center justify-center"
          >
            <Text className="text-white font-bold text-lg">Finish</Text>
          </Pressable>
        </View>

        {/* IMAGE MODAL */}
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <SafeAreaView className="flex-1 bg-black/95">
            <View className="flex-row justify-end p-4">
              <Pressable
                onPress={() => setImageModalVisible(false)}
                className="bg-gray-800 rounded-full p-2 border border-gray-600"
              >
                <X size={28} color="white" />
              </Pressable>
            </View>
            <View className="flex-1 justify-center items-center p-4">
              <View className="w-3/4 aspect-square bg-white rounded-lg overflow-hidden">
                <Image
                  source={{ uri: licenseImage }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        {/* ADD ITEM MODAL */}
        <Modal
          visible={addItemModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setAddItemModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-white w-full max-w-sm rounded-lg p-5 gap-4">
              <Text className="text-lg font-bold">Add Item</Text>

              {/* Material Picker */}
              <View>
                <Text className="text-gray-600 text-xs uppercase font-bold mb-1">
                  Material
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newItemMaterialId}
                    onValueChange={setNewItemMaterialId}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <Picker.Item
                      label="Select Material"
                      value={null}
                      enabled={false}
                    />
                    {materialsList.map((m) => (
                      <Picker.Item
                        key={m.value}
                        label={m.label}
                        value={m.value}
                      />
                    ))}
                  </Picker>
                </View>
                {transactionType === "Selling" && newItemMaterialId && (
                  <Text className="text-xs text-orange-600 mt-1 font-bold">
                    Available Stock: {availableStock} kg
                  </Text>
                )}
              </View>

              {/* Inputs */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-gray-600 text-xs uppercase font-bold mb-1">
                    Weight
                  </Text>
                  <TextInput
                    placeholder="0.0"
                    keyboardType="numeric"
                    className="border border-gray-300 rounded h-12 px-3 text-lg"
                    value={newItemWeight}
                    onChangeText={setNewItemWeight}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-xs uppercase font-bold mb-1">
                    Price
                  </Text>
                  <TextInput
                    placeholder="0.0"
                    keyboardType="numeric"
                    className="border border-gray-300 rounded h-12 px-3 text-lg"
                    value={newItemPrice}
                    onChangeText={setNewItemPrice}
                  />
                </View>
              </View>

              {/* Live Subtotal */}
              <View className="items-end">
                <Text className="text-xs text-gray-500 uppercase font-bold">
                  Subtotal
                </Text>
                <Text className="text-xl font-bold text-blue-700">
                  ₱{newItemSubtotal}
                </Text>
              </View>

              <View className="flex-row gap-3 mt-2">
                <Pressable
                  onPress={() => setAddItemModalVisible(false)}
                  className="flex-1 bg-gray-200 p-3 rounded items-center"
                >
                  <Text className="font-bold text-gray-700">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={saveNewItem}
                  className="flex-1 bg-blue-600 p-3 rounded items-center"
                >
                  <Text className="font-bold text-white">Add</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* FINISH MODAL */}
        <Modal
          visible={finishModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFinishModalVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center p-4">
            <View className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl">
              <Text className="text-xl font-bold text-gray-800 mb-2">
                Finish Transaction
              </Text>
              <Text className="text-gray-600 mb-6">
                Enter the amount paid by the client.
              </Text>
              <View className="mb-6">
                <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                  Amount Paid (₱)
                </Text>
                <TextInput
                  placeholder="0.00"
                  keyboardType="numeric"
                  autoFocus={true}
                  value={paidAmountInput}
                  onChangeText={setPaidAmountInput}
                  className="border border-green-500 bg-green-50 rounded px-3 h-14 text-2xl font-bold text-green-800 text-center"
                />
              </View>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setFinishModalVisible(false)}
                  className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
                >
                  <Text className="font-bold text-gray-700">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmFinish}
                  className="flex-1 bg-green-600 py-3 rounded-lg items-center"
                >
                  <Text className="font-bold text-white">Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    height: 48,
    backgroundColor: "white",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    justifyContent: "center",
  },
  visualContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  pickerText: { flex: 1, fontSize: 16, color: "black" },
  placeholderText: { color: "#9ca3af" },
  invisiblePicker: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  arrowContainer: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roundedArrow: {
    width: 8,
    height: 8,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: "#6b7280",
    transform: [{ rotate: "45deg" }],
    marginTop: -3,
  },
});
