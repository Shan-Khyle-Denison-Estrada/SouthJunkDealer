import * as Print from "expo-print";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Printer } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { materials, transactionItems, transactions } from "../db/schema";
import { db } from "./_layout";

export default function TransactionDetailed() {
  const params = useLocalSearchParams();
  const transactionId = Number(params.transactionId);

  const [lineItems, setLineItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [transactionType, setTransactionType] = useState("-");
  const [paymentMethod, setPaymentMethod] = useState("-");
  const [date, setDate] = useState("-");
  const [status, setStatus] = useState("-");

  const loadTransactionData = async () => {
    if (!transactionId) return;

    try {
      // 1. Fetch Header Info
      const txHeader = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));
      if (txHeader.length > 0) {
        const header = txHeader[0];
        setTransactionType(header.type || "-");
        setPaymentMethod(header.paymentMethod || "-");
        setDate(header.date || "-");
        setStatus(header.status || "-");
        setGrandTotal(header.totalAmount || 0);
      }

      // 2. Fetch Line Items
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
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load details");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactionData();
    }, [transactionId]),
  );

  // --- PRINT FUNCTIONALITY WITH TIME ---
  const handlePrint = async () => {
    // Current Time for "Printed On"
    const now = new Date();
    const printDateStr = now.toLocaleDateString();
    const printTimeStr = now.toLocaleTimeString();

    const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          </head>
          <body style="font-family: Helvetica Neue; padding: 20px;">
            <h1 style="text-align: center;">Transaction Record</h1>
            <p style="text-align: center; color: #555;">ID: #${transactionId}</p>

            <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; background-color: #fafafa;">
                <table style="width: 100%;">
                    <tr>
                        <td><strong>Transaction Date:</strong></td>
                        <td style="text-align: right;">${date}</td>
                    </tr>
                    <tr>
                        <td><strong>Type:</strong></td>
                        <td style="text-align: right;">${transactionType}</td>
                    </tr>
                    <tr>
                        <td><strong>Payment Method:</strong></td>
                        <td style="text-align: right;">${paymentMethod}</td>
                    </tr>
                    <tr>
                        <td><strong>Status:</strong></td>
                        <td style="text-align: right;">${status}</td>
                    </tr>
                </table>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #333; color: white;">
                  <th style="padding: 10px; text-align: left;">ID</th>
                  <th style="padding: 10px; text-align: left;">Material</th>
                  <th style="padding: 10px; text-align: center;">Weight</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems
                  .map(
                    (item) => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${item.id}</td>
                    <td style="padding: 10px;">${item.material}</td>
                    <td style="padding: 10px; text-align: center;">${item.weight} ${item.uom}</td>
                    <td style="padding: 10px; text-align: right;">₱${item.price}</td>
                    <td style="padding: 10px; text-align: right;">₱${item.subtotal.toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: right;">
                <h2 style="margin: 0; color: #2563eb;">Total: ₱${grandTotal.toFixed(2)}</h2>
            </div>

            <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 10px; text-align: center; color: #aaa;">
                Printed On: ${printDateStr} at ${printTimeStr}
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
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* TOP HEADER SECTION */}
      <View className="flex-row gap-4 h-24 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <View className="flex-1 justify-center">
          <Text className="text-gray-500 text-xs font-bold uppercase">
            Transaction ID
          </Text>
          <Text className="text-xl font-bold text-gray-800">
            {transactionId}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-gray-500 text-xs font-bold uppercase">
            Type
          </Text>
          <Text
            className={`text-lg font-bold ${transactionType === "Selling" ? "text-green-600" : "text-blue-600"}`}
          >
            {transactionType}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-gray-500 text-xs font-bold uppercase">
            Payment
          </Text>
          <Text className="text-lg font-bold text-gray-800">
            {paymentMethod}
          </Text>
        </View>
        <View className="flex-1 justify-center items-end">
          <Text className="text-gray-500 text-xs font-bold uppercase">
            Total
          </Text>
          <Text className="text-2xl font-bold text-blue-700">
            ₱{grandTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* TABLE SECTION */}
      <View className="flex-[10] bg-white rounded-lg overflow-hidden border border-gray-200">
        <View className="flex-row bg-gray-800 p-4 items-center">
          <Text className="flex-1 font-bold text-white text-lg">Line ID</Text>
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
        </View>

        <FlatList
          data={lineItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View
              className={`flex-row items-center p-4 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
            >
              <Text className="flex-1 text-gray-800 text-lg font-medium">
                {item.id}
              </Text>
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
            </View>
          )}
        />
      </View>

      {/* FOOTER */}
      <View className="h-16 flex-row items-center justify-between gap-2">
        <View className="px-4 py-2 bg-gray-200 rounded-md flex-1">
          <Text className="font-bold text-gray-600">Status: {status}</Text>
        </View>

        {/* Print Button */}
        <Pressable
          onPress={handlePrint}
          className="bg-amber-500 px-4 py-3 rounded-lg flex-row items-center gap-2 active:bg-amber-600"
        >
          <Printer size={20} color="white" />
          <Text className="text-white font-bold">Print</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="bg-blue-600 px-6 py-3 rounded-lg flex-row items-center gap-2 active:bg-blue-700"
        >
          <ChevronLeft size={20} color="white" />
          <Text className="text-white font-bold text-lg">Back</Text>
        </Pressable>
      </View>
    </View>
  );
}
