import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Camera,
  Edit,
  Eye,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
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
import { eq } from "drizzle-orm";
import { materials, transactionItems, transactions } from "../db/schema";
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
  const transactionId = Number(params.transactionId);

  const [lineItems, setLineItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [transactionType, setTransactionType] = useState();
  const [paymentMethod, setPaymentMethod] = useState();

  // --- FORM STATE ---
  const [clientName, setClientName] = useState("");
  const [clientAffiliation, setClientAffiliation] = useState("");

  // Logistics (Selling Only)
  const [driverName, setDriverName] = useState("");
  const [truckPlate, setTruckPlate] = useState("");
  const [truckWeight, setTruckWeight] = useState("");
  const [licenseImage, setLicenseImage] = useState(null);

  // Modal State
  const [isImageModalVisible, setImageModalVisible] = useState(false);

  const loadTransactionData = async () => {
    if (!transactionId) return;

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
        weight: transactionItems.weight,
        price: transactionItems.price,
        subtotal: transactionItems.subtotal,
        uom: materials.uom,
      })
      .from(transactionItems)
      .leftJoin(materials, eq(transactionItems.materialId, materials.id))
      .where(eq(transactionItems.transactionId, transactionId));

    setLineItems(items);
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    setGrandTotal(total);
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactionData();
    }, [transactionId]),
  );

  const updateHeader = async (field, value) => {
    if (field === "type") setTransactionType(value);
    if (field === "payment") setPaymentMethod(value);

    try {
      await db
        .update(transactions)
        .set({ [field === "type" ? "type" : "paymentMethod"]: value })
        .where(eq(transactions.id, transactionId));
    } catch (e) {
      console.error("Failed to persist header", e);
    }
  };

  const takeLicensePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) {
      setLicenseImage(result.assets[0].uri);
    }
  };

  const handleAddItem = () => {
    if (!transactionType || !paymentMethod) {
      Alert.alert("Required", "Please select Type and Payment Method first.");
      return;
    }
    router.push({ pathname: "/newTransaction", params: { transactionId } });
  };

  const handleDeleteItem = async (itemId) => {
    await db.delete(transactionItems).where(eq(transactionItems.id, itemId));
    loadTransactionData();
  };

  const handleEditItem = (itemId) => {
    router.push({
      pathname: "/newTransaction",
      params: { transactionId, itemId },
    });
  };

  const handleDone = async () => {
    if (!transactionType || !paymentMethod) {
      Alert.alert("Error", "Select Transaction Type and Payment Method");
      return;
    }
    if (!clientName.trim()) {
      Alert.alert("Error", "Client Name is required");
      return;
    }
    if (transactionType === "Selling") {
      if (!driverName.trim() || !truckPlate.trim() || !truckWeight) {
        Alert.alert("Error", "All logistics fields are required for selling.");
        return;
      }
    }

    try {
      const now = new Date();
      await db
        .update(transactions)
        .set({
          totalAmount: grandTotal,
          status: "Completed",
          date: now.toISOString().split("T")[0],
          clientName,
          clientAffiliation: clientAffiliation || null,
          driverName: transactionType === "Selling" ? driverName : null,
          truckPlate: transactionType === "Selling" ? truckPlate : null,
          truckWeight:
            transactionType === "Selling" ? parseFloat(truckWeight) : null,
          licenseImageUri: transactionType === "Selling" ? licenseImage : null,
        })
        .where(eq(transactions.id, transactionId));

      router.navigate("/(tabs)/transactions");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handlePrint = async () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    const html = `
        <html>
          <body style="font-family: Helvetica Neue; padding: 20px;">
            <h1 style="text-align: center;">Transaction Receipt</h1>
            <p style="text-align: center; color: #555;">ID: #${transactionId}</p>
            
            <div style="margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
                <div><strong>Date:</strong> ${dateStr} ${timeStr}</div>
                <div><strong>Type:</strong> ${transactionType || "-"}</div>
                <div><strong>Payment:</strong> ${paymentMethod || "-"}</div>
                <div style="margin-top:5px;"><strong>Client:</strong> ${clientName || "N/A"}</div>
                ${clientAffiliation ? `<div><strong>Affiliation:</strong> ${clientAffiliation}</div>` : ""}
            </div>

            ${
              transactionType === "Selling"
                ? `
            <div style="margin-bottom: 20px; border: 1px dashed #aaa; padding: 10px; background-color: #f9f9f9;">
                <div style="font-weight:bold; margin-bottom:5px; text-decoration: underline;">Logistics Details</div>
                <div><strong>Driver:</strong> ${driverName}</div>
                <div><strong>Truck Plate:</strong> ${truckPlate}</div>
                <div><strong>Weight:</strong> ${truckWeight} kg</div>
            </div>
            `
                : ""
            }

            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Material</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">Weight</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.material}</td>
                    <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.weight} ${item.uom}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">₱${item.price}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">₱${item.subtotal.toFixed(2)}</td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>

            <div style="margin-top: 30px; text-align: right;">
                <h2 style="margin: 0;">Total: ₱${grandTotal.toFixed(2)}</h2>
            </div>
          </body>
        </html>
        `;

    try {
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Print Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View className="flex-1 bg-gray-50 p-3 gap-3">
        {/* --- COMPACT HEADER FORM --- */}
        <View className="bg-white p-3 rounded-lg border border-gray-200 gap-3 shadow-sm">
          {/* Row 1: Type & Payment */}
          <View className="flex-row gap-3">
            <View className="flex-1">
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
                Payment
              </Text>
              <SummaryPicker
                selectedValue={paymentMethod}
                onValueChange={(v) => updateHeader("payment", v)}
                placeholder="Method"
                items={["Cash", "G-Cash", "Bank Transfer"]}
              />
            </View>
          </View>

          {/* Row 2: Client Info */}
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
                Affiliation/Company
              </Text>
              <TextInput
                placeholder="Optional"
                value={clientAffiliation}
                onChangeText={setClientAffiliation}
                className="border border-gray-300 rounded px-2 h-12 bg-white text-base"
              />
            </View>
          </View>

          {/* Conditional Rows: Selling Logistics */}
          {transactionType === "Selling" && (
            <>
              {/* Row 3: Driver & Plate */}
              <View className="flex-row gap-3">
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

              {/* Row 4: Weight & Camera */}
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
                  {/* Camera Button */}
                  <Pressable
                    onPress={takeLicensePhoto}
                    className={`flex-1 h-12 rounded items-center justify-center flex-row gap-1 border ${licenseImage ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-300"}`}
                  >
                    <Camera size={18} color="black" />
                    <Text className="text-xs font-bold">
                      {licenseImage ? "Retake" : "License"}
                    </Text>
                  </Pressable>

                  {/* View Button (Only if image exists) */}
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

        {/* --- TOTAL & LIST --- */}
        <View className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <View className="flex-row bg-gray-100 p-2 border-b border-gray-200 justify-between items-center">
            <Text className="font-bold text-gray-700">Items List</Text>
            <Text className="font-bold text-blue-700 text-lg">
              Total: ₱{grandTotal.toFixed(2)}
            </Text>
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
                  <Pressable onPress={() => handleEditItem(item.id)}>
                    <Edit size={18} color="#d97706" />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteItem(item.id)}>
                    <Trash2 size={18} color="#dc2626" />
                  </Pressable>
                </View>
              </View>
            )}
          />
        </View>

        {/* --- FOOTER BUTTONS --- */}
        <View className="flex-row gap-2 h-14">
          <Pressable
            onPress={handleAddItem}
            className="flex-1 bg-blue-600 rounded-lg flex-row items-center justify-center gap-2"
          >
            <Plus size={22} color="white" />
            <Text className="text-white font-bold text-lg">Add Item</Text>
          </Pressable>
          <Pressable
            onPress={handlePrint}
            className="w-14 bg-amber-500 rounded-lg items-center justify-center"
          >
            <Printer size={22} color="white" />
          </Pressable>
          <Pressable
            onPress={handleDone}
            className="flex-1 bg-green-600 rounded-lg items-center justify-center"
          >
            <Text className="text-white font-bold text-lg">Finish</Text>
          </Pressable>
        </View>

        {/* --- IMAGE MODAL --- */}
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
              {/* MINIMIZED MODAL SIZE (w-3/4) */}
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
