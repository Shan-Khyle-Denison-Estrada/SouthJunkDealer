import * as Print from "expo-print";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Camera,
  CheckCircle,
  ChevronLeft,
  Printer,
  X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { materials, transactionItems, transactions } from "../db/schema";
import { db } from "./_layout";

export default function TransactionDetailed() {
  const params = useLocalSearchParams();
  const transactionId = Number(params.transactionId);

  const [lineItems, setLineItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [header, setHeader] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);

  const loadTransactionData = async () => {
    if (!transactionId) return;
    try {
      const txHeader = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));
      if (txHeader.length > 0) setHeader(txHeader[0]);

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
      setGrandTotal(txHeader[0]?.totalAmount || 0);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactionData();
    }, [transactionId]),
  );

  // Helper to check if transaction is commercial (Buying/Selling)
  const isCommercial =
    header.type === "Buying" || header.type === "Selling";

  const getStatusInfo = () => {
    // If not commercial, status isn't really applicable in the financial sense,
    // but we can default to something or just hide the badge.
    // For now, we'll keep the logic but handle visibility in render.
    const paid = header.paidAmount || 0;
    const total = header.totalAmount || 0;
    if (paid >= total && total > 0)
      return {
        label: "PAID",
        color: "text-green-700 bg-green-100 border-green-200",
      };
    if (paid > 0)
      return {
        label: "PARTIAL",
        color: "text-yellow-700 bg-yellow-100 border-yellow-200",
      };
    return {
      label: "UNPAID",
      color: "text-red-700 bg-red-100 border-red-200",
    };
  };

  const statusInfo = getStatusInfo();
  const isFullyPaid =
    (header.paidAmount || 0) >= (header.totalAmount || 0) &&
    header.totalAmount > 0;

  const handleMarkAsPaid = () => {
    Alert.alert(
      "Confirm Full Payment",
      `Mark transaction #${transactionId} as fully paid? This will set the paid amount to ₱${header.totalAmount?.toFixed(2)}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await db
                .update(transactions)
                .set({ paidAmount: header.totalAmount })
                .where(eq(transactions.id, transactionId));
              loadTransactionData(); // Refresh data
            } catch (e) {
              Alert.alert("Error", "Failed to update payment status");
            }
          },
        },
      ],
    );
  };

  const handlePrint = async () => {
    const now = new Date();
    const printDateStr = now.toLocaleDateString();
    const printTimeStr = now.toLocaleTimeString();

    // Conditional HTML blocks
    const financialRows = isCommercial
      ? `
        <tr><td style="padding: 4px;"><strong>Payment Method:</strong></td><td style="text-align: right;">${header.paymentMethod || "-"}</td></tr>
        <tr><td style="padding: 4px;"><strong>Status:</strong></td><td style="text-align: right;">${statusInfo.label}</td></tr>
        <tr><td style="padding: 4px;"><strong>Amount Paid:</strong></td><td style="text-align: right;">₱${(header.paidAmount || 0).toFixed(2)}</td></tr>
        `
      : "";

    const clientRows = isCommercial
      ? `
        <tr><td style="border-top: 1px dashed #ddd; padding: 8px 4px 4px 4px;"><strong>Client Name:</strong></td><td style="border-top: 1px dashed #ddd; padding: 8px 4px 4px 4px; text-align: right;">${header.clientName || "-"}</td></tr>
        <tr><td style="padding: 4px;"><strong>Company:</strong></td><td style="text-align: right;">${header.clientAffiliation || "N/A"}</td></tr>
        `
      : "";

    const logisticsDiv =
      header.type === "Selling"
        ? `
            <div style="margin-bottom: 20px; border: 1px dashed #333; padding: 10px;">
                <h3 style="margin-top:0;">Logistics Details</h3>
                <p style="margin: 5px 0;"><strong>Driver Name:</strong> ${header.driverName || "N/A"}</p>
                <p style="margin: 5px 0;"><strong>Truck Plate:</strong> ${header.truckPlate || "N/A"}</p>
                <p style="margin: 5px 0;"><strong>Truck Weight:</strong> ${header.truckWeight} kg</p>
            </div>`
        : "";

    const html = `
        <html>
          <body style="font-family: Helvetica Neue; padding: 20px;">
            <h1 style="text-align: center;">Transaction Record</h1>
            <p style="text-align: center; color: #555;">ID: #${transactionId}</p>

            <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; background-color: #fafafa;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 4px;"><strong>Date:</strong></td><td style="text-align: right;">${header.date}</td></tr>
                    <tr><td style="padding: 4px;"><strong>Type:</strong></td><td style="text-align: right;">${header.type}</td></tr>
                    ${financialRows}
                    ${clientRows}
                </table>
            </div>

            ${logisticsDiv}

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #333; color: white;">
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
                    <td style="padding: 10px;">${item.material}</td>
                    <td style="padding: 10px; text-align: center;">${item.weight} ${item.uom}</td>
                    <td style="padding: 10px; text-align: right;">₱${item.price}</td>
                    <td style="padding: 10px; text-align: right;">₱${item.subtotal.toFixed(2)}</td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: right;">
                ${
                  isCommercial
                    ? `<h3 style="margin: 5px 0; color: #555;">Amount Paid: ₱${(header.paidAmount || 0).toFixed(2)}</h3>`
                    : ""
                }
                <h2 style="margin: 0; color: #2563eb;">Total: ₱${grandTotal.toFixed(2)}</h2>
            </div>
            <div style="margin-top: 30px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #aaa; padding-top:5px">
                Printed: ${printDateStr} ${printTimeStr}
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
      {/* --- HEADER CONTAINER --- */}
      <View className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm gap-4">
        
        {/* LAYER 1: ID, Type, Date, Status */}
        <View
          className={`flex-row justify-between items-center ${isCommercial ? "border-b border-gray-100 pb-3" : ""}`}
        >
          <View>
            <Text className="text-[10px] text-gray-400 font-bold uppercase">
              Transaction ID
            </Text>
            <Text className="font-bold text-gray-800 text-lg">
              #{transactionId}
            </Text>
          </View>

          <View>
            <Text className="text-[10px] text-gray-400 font-bold uppercase">
              Type
            </Text>
            <Text
              className={`font-bold ${header.type === "Selling" ? "text-orange-600" : "text-blue-600"}`}
            >
              {header.type}
            </Text>
          </View>

          <View>
            <Text className="text-[10px] text-gray-400 font-bold uppercase">
              Date
            </Text>
            <Text className="font-medium text-gray-800">{header.date}</Text>
          </View>

          {/* Status Badge - Only for Commercial */}
          {isCommercial ? (
            <View className="items-end">
              <View
                className={`px-2 py-1 rounded border ${statusInfo.color.split(" ").filter((c) => c.startsWith("bg") || c.startsWith("border")).join(" ")}`}
              >
                <Text
                  className={`text-xs font-bold ${statusInfo.color.split(" ")[0]}`}
                >
                  {statusInfo.label}
                </Text>
              </View>
            </View>
          ) : (
            <View className="items-end">
              <View className="px-2 py-1 rounded border bg-gray-100 border-gray-200">
                <Text className="text-xs font-bold text-gray-500">N/A</Text>
              </View>
            </View>
          )}
        </View>

        {/* FINANCIAL SUMMARY ROW (Only if Commercial) */}
        {isCommercial && (
          <View className="flex-row justify-between bg-gray-50 p-2 rounded border border-gray-100 items-center">
            <View>
              <Text className="text-[10px] text-gray-400 font-bold uppercase">
                Payment Method
              </Text>
              <Text className="font-bold text-gray-700">
                {header.paymentMethod}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="items-end">
                <Text className="text-[10px] text-gray-400 font-bold uppercase">
                  Amount Paid
                </Text>
                <Text className="font-bold text-green-700">
                  ₱{(header.paidAmount || 0).toFixed(2)}
                </Text>
              </View>

              {/* Mark As Paid Button (Only visible if not fully paid) */}
              {!isFullyPaid && (
                <Pressable
                  onPress={handleMarkAsPaid}
                  className="bg-green-600 px-3 py-2 rounded-md flex-row items-center gap-1 active:bg-green-700"
                >
                  <CheckCircle size={14} color="white" />
                  <Text className="text-white text-xs font-bold">
                    Mark Full
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* LAYER 2: CLIENT / LOGISTICS (Conditional) */}
        {header.type === "Selling" ? (
          // --- SELLING: TWO COLUMNS (Client | Logistics) ---
          <View className="flex-row gap-4 h-32">
            {/* Left Column: Client Info */}
            <View className="flex-1 bg-gray-50 p-3 rounded border border-gray-200 justify-center">
              <Text className="text-[10px] text-gray-500 font-bold uppercase mb-2 border-b border-gray-200 pb-1">
                Client Details
              </Text>
              <View className="mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase">
                  Name
                </Text>
                <Text className="font-bold text-gray-800 text-sm leading-4">
                  {header.clientName || "-"}
                </Text>
              </View>
              <View>
                <Text className="text-[10px] text-gray-400 font-bold uppercase">
                  Company
                </Text>
                <Text className="text-sm text-gray-700 leading-4">
                  {header.clientAffiliation || "N/A"}
                </Text>
              </View>
            </View>

            {/* Right Column: Logistics Info (2x2 Grid) */}
            <View className="flex-1 p-3 rounded border bg-orange-50 border-orange-200">
              <Text className="text-[10px] font-bold uppercase mb-2 border-b pb-1 text-orange-800 border-orange-200">
                Logistics Info
              </Text>

              <View className="flex-1 justify-between">
                {/* Row 1: Driver | Weight */}
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-2">
                    <Text className="text-[10px] text-orange-800/70 font-bold uppercase">
                      Driver
                    </Text>
                    <Text
                      className="text-xs text-gray-800 font-bold"
                      numberOfLines={1}
                    >
                      {header.driverName}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-orange-800/70 font-bold uppercase">
                      Weight
                    </Text>
                    <Text className="text-xs text-gray-800 font-bold">
                      {header.truckWeight} kg
                    </Text>
                  </View>
                </View>

                {/* Row 2: Plate | Button */}
                <View className="flex-row justify-between items-end">
                  <View className="flex-1 mr-2">
                    <Text className="text-[10px] text-orange-800/70 font-bold uppercase">
                      Plate
                    </Text>
                    <Text className="text-xs text-gray-800 font-bold">
                      {header.truckPlate}
                    </Text>
                  </View>

                  {header.licenseImageUri && (
                    <Pressable
                      onPress={() => setModalVisible(true)}
                      className="bg-white border border-orange-300 rounded-md px-3 py-2 flex-row items-center shadow-sm active:bg-orange-100"
                    >
                      <Camera size={16} color="#c2410c" />
                      <Text className="text-[10px] text-orange-700 font-bold ml-1 uppercase">
                        License
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : header.type === "Buying" ? (
          // --- BUYING: WHOLE ROW FORMAT ---
          <View className="bg-gray-50 p-4 rounded border border-gray-200">
            <Text className="text-[10px] text-gray-500 font-bold uppercase mb-2 border-b border-gray-200 pb-1">
              Client Details
            </Text>
            <View className="flex-row justify-between items-center">
              {/* Left: Name */}
              <View className="flex-1">
                <Text className="text-[10px] text-gray-400 font-bold uppercase">
                  Name
                </Text>
                <Text className="font-bold text-gray-800 text-lg">
                  {header.clientName || "-"}
                </Text>
              </View>

              {/* Right: Company */}
              <View className="flex-1 items-end">
                <Text className="text-[10px] text-gray-400 font-bold uppercase">
                  Company
                </Text>
                <Text className="font-medium text-gray-700 text-lg">
                  {header.clientAffiliation || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        ) : null /* Other Types = Hide Client & Logistics */}
      </View>

      {/* --- TABLE --- */}
      <View className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <View className="flex-row bg-gray-800 p-3 items-center">
          <Text className="flex-[2] font-bold text-white text-sm">
            Material
          </Text>
          <Text className="flex-1 font-bold text-white text-center text-sm">
            Weight
          </Text>
          <Text className="flex-1 font-bold text-white text-center text-sm">
            Price
          </Text>
          <Text className="flex-1 font-bold text-white text-center text-sm">
            Subtotal
          </Text>
        </View>

        <FlatList
          data={lineItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View
              className={`flex-row items-center p-3 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
            >
              <Text className="flex-[2] text-gray-800 font-medium text-sm">
                {item.material}
              </Text>
              <Text className="flex-1 text-gray-600 text-center text-sm">
                {item.weight} {item.uom}
              </Text>
              <Text className="flex-1 text-gray-600 text-center text-sm">
                ₱{item.price}
              </Text>
              <Text className="flex-1 text-blue-700 text-center font-bold text-sm">
                ₱{item.subtotal.toFixed(2)}
              </Text>
            </View>
          )}
        />
      </View>

      {/* --- FOOTER --- */}
      <View className="h-14 flex-row items-center justify-between gap-3">
        <View className="px-4 py-2 bg-white border border-gray-300 rounded-md flex-1 justify-center">
          <Text className="font-bold text-gray-600 text-xs uppercase">
            Total Amount
          </Text>
          <Text className="font-bold text-blue-700 text-lg">
            ₱{grandTotal.toFixed(2)}
          </Text>
        </View>
        <Pressable
          onPress={handlePrint}
          className="bg-amber-500 w-14 h-full rounded-lg items-center justify-center"
        >
          <Printer size={24} color="white" />
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          className="bg-blue-600 w-14 h-full rounded-lg items-center justify-center"
        >
          <ChevronLeft size={24} color="white" />
        </Pressable>
      </View>

      {/* --- IMAGE MODAL --- */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-black/95">
          <View className="flex-row justify-end p-4">
            <Pressable
              onPress={() => setModalVisible(false)}
              className="bg-gray-800 rounded-full p-2 border border-gray-600"
            >
              <X size={28} color="white" />
            </Pressable>
          </View>
          <View className="flex-1 justify-center items-center p-4">
            <View className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <Image
                source={{ uri: header.licenseImageUri }}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}