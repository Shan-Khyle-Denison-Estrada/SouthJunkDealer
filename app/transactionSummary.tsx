import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Camera,
  Check,
  ChevronDown,
  Eye,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
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
  TouchableOpacity,
  View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { and, asc, eq, gt, sum } from "drizzle-orm";
import {
  auditTrails,
  inventory,
  inventoryTransactionItems,
  materials,
  paymentMethods, // Imported paymentMethods table
  transactionItems,
  transactions,
} from "../db/schema";
import { db } from "../db/client";

// --- CUSTOM PICKER COMPONENT ---
// Replaces the native picker with a robust Modal-based implementation
const CustomPicker = ({ selectedValue, onValueChange, placeholder, items }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((i) => i.value === selectedValue);
  const displayLabel = selectedItem ? selectedItem.label : placeholder;

  return (
    <>
      {/* 1. The Trigger Field - Fully Clickable */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={styles.pickerTrigger}
      >
        <Text
          style={[styles.pickerText, !selectedValue && styles.placeholderText]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <ChevronDown size={20} color="gray" />
      </Pressable>

      {/* 2. The Options Modal */}
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
  const [paymentMethodList, setPaymentMethodList] = useState([]); // State for dynamic payment methods
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

  // Load Payment Methods from DB
  const loadPaymentMethods = async () => {
    try {
      const data = await db.select().from(paymentMethods);
      // Mapping name to value because transactions table stores the string name
      setPaymentMethodList(
        data.map((pm) => ({ label: pm.name, value: pm.name })),
      );
    } catch (e) {
      console.error("Failed to load payment methods", e);
    }
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
      loadPaymentMethods(); // Fetch payment methods on focus
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
    // Note: Expo ImagePicker setup required in actual device
    // import * as ImagePicker from "expo-image-picker";
    // For brevity, assuming imports are handled or this is a stub
    // The user provided code imported ImagePicker, so we keep using it if available.
    // However, it wasn't in the provided imports block above, so I'll skip implementation details to avoid errors if package missing.
    // Re-adding logic assuming package exists based on previous file context:
    const {
      requestCameraPermissionsAsync,
      launchCameraAsync,
      MediaTypeOptions,
    } = require("expo-image-picker");

    const res = await requestCameraPermissionsAsync();
    if (!res.granted) {
      Alert.alert("Permission Required");
      return;
    }
    const result = await launchCameraAsync({
      mediaTypes: MediaTypeOptions.Images,
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
    if (lineItems.length === 0) {
      Alert.alert("Error", "Please add at least one item to the list.");
      return;
    }
    if (!clientName.trim()) {
      Alert.alert("Error", "Client Name required");
      return;
    }
    if (
      transactionType === "Selling" &&
      (!driverName || !truckPlate || !truckWeight || !licenseImage)
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
          if (transactionType === "Selling") {
            let remainingQty = item.weight;

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

              await db
                .update(inventory)
                .set({
                  netWeight: newWeight,
                  status: newWeight === 0 ? "Depleted" : "In Stock",
                })
                .where(eq(inventory.id, batch.id));

              await db.insert(inventoryTransactionItems).values({
                inventoryId: batch.id,
                transactionItemId: newItemId,
                allocatedWeight: take,
              });

              await db.insert(auditTrails).values({
                inventoryId: batch.id,
                action: "Stock Out",
                notes: `Sold in Tx #${finalTxId}`,
                date: localDate,
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
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Type <Text className="text-red-500">*</Text>
              </Text>
              <View className="h-12">
                <CustomPicker
                  selectedValue={transactionType}
                  onValueChange={(v) => updateHeader("type", v)}
                  placeholder="Type"
                  items={[
                    { label: "Buying", value: "Buying" },
                    { label: "Selling", value: "Selling" },
                  ]}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Payment Method <Text className="text-red-500">*</Text>
              </Text>
              <View className="h-12">
                <CustomPicker
                  selectedValue={paymentMethod}
                  onValueChange={(v) => updateHeader("payment", v)}
                  placeholder="Method"
                  items={paymentMethodList} // Replaced hardcoded items with DB data
                />
              </View>
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Client Name <Text className="text-red-500">*</Text>
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
                    Driver <Text className="text-red-500">*</Text>
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
                    Plate # <Text className="text-red-500">*</Text>
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
                    Truck Weight (kg) <Text className="text-red-500">*</Text>
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
                      {licenseImage ? (
                        "Retake"
                      ) : (
                        <>
                          License<Text className="text-red-500">*</Text>
                        </>
                      )}
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
                  Material <Text className="text-red-500">*</Text>
                </Text>
                <View className="h-14">
                  <CustomPicker
                    selectedValue={newItemMaterialId}
                    onValueChange={setNewItemMaterialId}
                    placeholder="Select Material"
                    items={materialsList}
                  />
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
                    Weight <Text className="text-red-500">*</Text>
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
                    Price <Text className="text-red-500">*</Text>
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
  // New Styles for the Custom Picker
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6", // Matched input bg
    borderWidth: 1,
    borderColor: "#d1d5db", // Matched input border
    borderRadius: 6,
    paddingHorizontal: 12,
    height: "100%", // Inherit height from parent View
    width: "100%",
  },
  pickerText: {
    fontSize: 16,
    color: "black",
    flex: 1,
  },
  placeholderText: {
    color: "#9ca3af",
  },
  // Modal Styles for Picker
  pickerOptionsContainer: {
    backgroundColor: "white",
    width: "40%", // Narrower than main modal
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
  modalContent: {
    backgroundColor: "white",
    width: "50%",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
