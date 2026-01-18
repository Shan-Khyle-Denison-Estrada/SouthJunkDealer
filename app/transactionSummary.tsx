import { Picker } from "@react-native-picker/picker";
import * as Print from "expo-print";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Edit, Plus, Printer, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { materials, transactionItems, transactions } from "../db/schema";
import { db } from "./_layout";

// --- PICKER COMPONENT ---
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
  // Default to current date for the state
  const [transactionDate, setTransactionDate] = useState(new Date());

  const loadTransactionData = async () => {
    if (!transactionId) return;

    const txHeader = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));
    if (txHeader.length > 0) {
      setTransactionType(txHeader[0].type);
      setPaymentMethod(txHeader[0].paymentMethod);
      if (txHeader[0].date) {
        // Attempt to parse DB date, fallback to now if invalid
        const dbDate = new Date(txHeader[0].date);
        if (!isNaN(dbDate.getTime())) {
          setTransactionDate(dbDate);
        }
      }
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
        .set({
          [field === "type" ? "type" : "paymentMethod"]: value,
        })
        .where(eq(transactions.id, transactionId));
    } catch (e) {
      console.error("Failed to persist header", e);
    }
  };

  const handleAddItem = () => {
    if (!transactionType || !paymentMethod) {
      Alert.alert(
        "Missing Information",
        "Please select a Transaction Type and Payment Method before adding items.",
      );
      return;
    }

    router.push({
      pathname: "/newTransaction",
      params: { transactionId },
    });
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert("Delete Item", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await db
            .delete(transactionItems)
            .where(eq(transactionItems.id, itemId));
          loadTransactionData();
        },
      },
    ]);
  };

  const handleEditItem = (itemId) => {
    router.push({
      pathname: "/newTransaction",
      params: { transactionId: transactionId, itemId: itemId },
    });
  };

  // --- PRINT FUNCTIONALITY WITH EXPLICIT TIME FORMATTING ---
  const handlePrint = async () => {
    // Force use of current time for the receipt timestamp
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const fullDateTime = `${dateStr} ${timeStr}`;

    const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          </head>
          <body style="font-family: Helvetica Neue; padding: 20px;">
            <h1 style="text-align: center;">Transaction Receipt</h1>
            <p style="text-align: center; color: #555; margin-top: -10px;">ID: #${transactionId}</p>
            
            <div style="margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Date:</strong>
                    <span>${dateStr}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Time:</strong>
                    <span>${timeStr}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Type:</strong>
                    <span>${transactionType || "-"}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <strong>Payment Method:</strong>
                    <span>${paymentMethod || "-"}</span>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Material</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Weight</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.material}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.weight} ${item.uom}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">₱${item.price}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">₱${item.subtotal.toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>

            <div style="margin-top: 30px; text-align: right;">
                <h2 style="margin: 0;">Total: ₱${grandTotal.toFixed(2)}</h2>
            </div>
            
            <div style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 10px; text-align: center; font-size: 12px; color: #888;">
                <p>Generated on ${fullDateTime}</p>
                <p>Thank you for your business!</p>
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

  const handleDone = async () => {
    if (!transactionType || !paymentMethod) {
      Alert.alert("Error", "Please select Transaction Type and Payment Method");
      return;
    }
    try {
      // Save the current timestamp to DB as a string
      const now = new Date();
      await db
        .update(transactions)
        .set({
          totalAmount: grandTotal,
          status: "Completed",
          date: now.toLocaleString(), // Save full date and time string
        })
        .where(eq(transactions.id, transactionId));

      router.navigate("/(tabs)/transactions");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      <View className="flex-row gap-4 h-24">
        <View className="flex-1">
          <Text className="mb-1 font-bold text-gray-700">Type</Text>
          <SummaryPicker
            selectedValue={transactionType}
            onValueChange={(v) => updateHeader("type", v)}
            placeholder="Select Type"
            items={["Buying", "Selling"]}
          />
        </View>
        <View className="flex-1">
          <Text className="mb-1 font-bold text-gray-700">Payment</Text>
          <SummaryPicker
            selectedValue={paymentMethod}
            onValueChange={(v) => updateHeader("payment", v)}
            placeholder="Select Method"
            items={["Cash", "G-Cash", "Bank Transfer"]}
          />
        </View>
        <View className="flex-1 items-end justify-center">
          <Text className="text-gray-500 font-bold">Total Amount</Text>
          <Text className="text-3xl font-bold text-blue-700">
            ₱{grandTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      <View className="flex-[10] bg-white rounded-lg overflow-hidden border border-gray-200">
        <View className="flex-row bg-gray-800 p-4 items-center">
          <Text className="flex-[2] font-bold text-white text-lg">
            Material
          </Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">
            Weight
          </Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">
            Price
          </Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">
            Subtotal
          </Text>
          <Text className="w-24 font-bold text-white text-center text-lg">
            Actions
          </Text>
        </View>

        <FlatList
          data={lineItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View
              className={`flex-row items-center p-4 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
            >
              <Text className="flex-[2] text-gray-800 text-lg font-medium">
                {item.material}
              </Text>
              <Text className="flex-1 text-gray-600 text-center text-lg">
                {item.weight} {item.uom}
              </Text>
              <Text className="flex-1 text-gray-600 text-center text-lg">
                ₱{item.price}
              </Text>
              <Text className="flex-1 text-blue-700 text-center text-lg font-bold">
                ₱{item.subtotal.toFixed(2)}
              </Text>

              <View className="w-24 flex-row justify-center gap-3">
                <Pressable
                  onPress={() => handleEditItem(item.id)}
                  className="p-2 bg-yellow-100 rounded-md"
                >
                  <Edit size={20} color="#d97706" />
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteItem(item.id)}
                  className="p-2 bg-red-100 rounded-md"
                >
                  <Trash2 size={20} color="#dc2626" />
                </Pressable>
              </View>
            </View>
          )}
        />
      </View>

      <View className="h-20 flex-row gap-2 mt-2">
        <Pressable
          onPress={handleAddItem}
          className="flex-[2] bg-blue-600 rounded-lg flex-row items-center justify-center gap-2"
        >
          <Plus size={24} color="white" />
          <Text className="text-white font-bold text-xl">Add</Text>
        </Pressable>

        {/* Print Button */}
        <Pressable
          onPress={handlePrint}
          className="flex-1 bg-amber-500 rounded-lg items-center justify-center"
        >
          <Printer size={24} color="white" />
          <Text className="text-white font-bold text-xs mt-1">Print</Text>
        </Pressable>

        <Pressable
          onPress={handleDone}
          className="flex-[2] bg-green-600 rounded-lg items-center justify-center"
        >
          <Text className="text-white font-bold text-xl">Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    height: 50,
    backgroundColor: "white",
    borderRadius: 6,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  visualContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: "100%",
    width: "100%",
  },
  pickerText: { fontSize: 16, color: "black", flex: 1 },
  placeholderText: { color: "#9ca3af" },
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
});
