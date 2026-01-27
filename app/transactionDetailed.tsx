import * as Print from "expo-print";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Camera,
  CheckCircle,
  Printer,
  X
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
  useColorScheme,
  View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { materials, transactionItems, transactions } from "../db/schema";

export default function TransactionDetailed() {
  const params = useLocalSearchParams();
  const transactionId = Number(params.transactionId);
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6", // Gray-100
    card: isDark ? "#1E1E1E" : "#ffffff", // White
    textPrimary: isDark ? "#FFFFFF" : "#1f2937", // Gray-800
    textSecondary: isDark ? "#A1A1AA" : "#6b7280", // Gray-500
    border: isDark ? "#333333" : "#e5e7eb", // Gray-200
    subtleBorder: isDark ? "#2C2C2C" : "#f3f4f6", // Gray-100
    headerBg: isDark ? "#0f0f0f" : "#1f2937", // Gray-800
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb", // Gray-50
    sectionBg: isDark ? "#2C2C2C" : "#f9fafb", // Gray-50

    // Specific Status Colors (Dark : Light)
    successBg: isDark ? "#064e3b" : "#dcfce7", // Green-900 : Green-100
    successBorder: isDark ? "#065f46" : "#bbf7d0", // Green-800 : Green-200
    successText: isDark ? "#4ade80" : "#15803d", // Green-400 : Green-700

    warningBg: isDark ? "#451a03" : "#fef9c3", // Yellow-950 : Yellow-100
    warningBorder: isDark ? "#78350f" : "#fde047", // Yellow-900 : Yellow-200
    warningText: isDark ? "#facc15" : "#a16207", // Yellow-400 : Yellow-700

    dangerBg: isDark ? "#450a0a" : "#fee2e2", // Red-950 : Red-100
    dangerBorder: isDark ? "#7f1d1d" : "#fecaca", // Red-900 : Red-200
    dangerText: isDark ? "#f87171" : "#b91c1c", // Red-400 : Red-700

    // Selling/Logistics Specifics
    orangeBg: isDark ? "#431407" : "#fff7ed", // Orange-950 : Orange-50
    orangeBorder: isDark ? "#7c2d12" : "#fed7aa", // Orange-900 : Orange-200
    orangeText: isDark ? "#fb923c" : "#c2410c", // Orange-400 : Orange-700
  };

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
  const isCommercial = header.type === "Buying" || header.type === "Selling";

  const getStatusInfo = () => {
    const paid = header.paidAmount || 0;
    const total = header.totalAmount || 0;
    if (paid >= total && total > 0)
      return {
        label: "PAID",
        bg: theme.successBg,
        border: theme.successBorder,
        text: theme.successText,
      };
    if (paid > 0)
      return {
        label: "PARTIAL",
        bg: theme.warningBg,
        border: theme.warningBorder,
        text: theme.warningText,
      };
    return {
      label: "UNPAID",
      bg: theme.dangerBg,
      border: theme.dangerBorder,
      text: theme.dangerText,
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

    // Conditional HTML blocks (Hardcoded Black/White for Physical Paper)
    const financialRows = isCommercial
      ? `
        <tr><td style="padding: 4px; color: #000;"><strong>Payment Method:</strong></td><td style="text-align: right; color: #000;">${header.paymentMethod || "-"}</td></tr>
        <tr><td style="padding: 4px; color: #000;"><strong>Status:</strong></td><td style="text-align: right; color: #000;">${statusInfo.label}</td></tr>
        <tr><td style="padding: 4px; color: #000;"><strong>Amount Paid:</strong></td><td style="text-align: right; color: #000;">₱${(header.paidAmount || 0).toFixed(2)}</td></tr>
        `
      : "";

    const clientRows = isCommercial
      ? `
        <tr><td style="border-top: 1px dashed #ddd; padding: 8px 4px 4px 4px; color: #000;"><strong>Client Name:</strong></td><td style="border-top: 1px dashed #ddd; padding: 8px 4px 4px 4px; text-align: right; color: #000;">${header.clientName || "-"}</td></tr>
        <tr><td style="padding: 4px; color: #000;"><strong>Company:</strong></td><td style="text-align: right; color: #000;">${header.clientAffiliation || "N/A"}</td></tr>
        `
      : "";

    const logisticsDiv =
      header.type === "Selling"
        ? `
            <div style="margin-bottom: 20px; border: 1px dashed #333; padding: 10px; color: #000;">
                <h3 style="margin-top:0; color: #000;">Logistics Details</h3>
                <p style="margin: 5px 0; color: #000;"><strong>Driver Name:</strong> ${header.driverName || "N/A"}</p>
                <p style="margin: 5px 0; color: #000;"><strong>Truck Plate:</strong> ${header.truckPlate || "N/A"}</p>
                <p style="margin: 5px 0; color: #000;"><strong>Truck Weight:</strong> ${header.truckWeight} kg</p>
            </div>`
        : "";

    const html = `
        <html>
          <body style="font-family: Helvetica Neue; padding: 20px; background-color: #fff; color: #000;">
            <h1 style="text-align: center; color: #000;">Transaction Record</h1>
            <p style="text-align: center; color: #555;">ID: #${transactionId}</p>

            <div style="margin-bottom: 20px; border: 1px solid #000; padding: 15px; border-radius: 5px; background-color: #fff;">
                <table style="width: 100%; border-collapse: collapse; color: #000;">
                    <tr><td style="padding: 4px; color: #000;"><strong>Date:</strong></td><td style="text-align: right; color: #000;">${header.date}</td></tr>
                    <tr><td style="padding: 4px; color: #000;"><strong>Type:</strong></td><td style="text-align: right; color: #000;">${header.type}</td></tr>
                    ${financialRows}
                    ${clientRows}
                </table>
            </div>

            ${logisticsDiv}

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; color: #000;">
              <thead>
                <tr style="background-color: #eee; color: #000;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #000;">Material</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid #000;">Weight</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #000;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #000;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems
                  .map(
                    (item) => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px; color: #000;">${item.material}</td>
                    <td style="padding: 10px; text-align: center; color: #000;">${item.weight} ${item.uom}</td>
                    <td style="padding: 10px; text-align: right; color: #000;">₱${item.price}</td>
                    <td style="padding: 10px; text-align: right; color: #000;">₱${item.subtotal.toFixed(2)}</td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: right;">
                ${
                  isCommercial
                    ? `<h3 style="margin: 5px 0; color: #000;">Amount Paid: ₱${(header.paidAmount || 0).toFixed(2)}</h3>`
                    : ""
                }
                <h2 style="margin: 0; color: #000;">Total: ₱${grandTotal.toFixed(2)}</h2>
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
    <View
      className="flex-1 p-4 gap-4"
      style={{ backgroundColor: theme.background }}
    >
      {/* --- HEADER CONTAINER --- */}
      <View
        className="rounded-lg border p-4 shadow-sm gap-4"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        {/* LAYER 1: ID, Type, Date, Status */}
        <View
          className="flex-row justify-between items-center pb-3 border-b"
          style={{
            borderBottomColor: isCommercial
              ? theme.subtleBorder
              : "transparent",
          }}
        >
          <View>
            <Text
              className="text-[10px] font-bold uppercase"
              style={{ color: theme.textSecondary }}
            >
              Transaction ID
            </Text>
            <Text
              className="font-bold text-lg"
              style={{ color: theme.textPrimary }}
            >
              #{transactionId}
            </Text>
          </View>

          <View>
            <Text
              className="text-[10px] font-bold uppercase"
              style={{ color: theme.textSecondary }}
            >
              Type
            </Text>
            <Text
              className={`font-bold ${
                header.type === "Selling"
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {header.type}
            </Text>
          </View>

          <View>
            <Text
              className="text-[10px] font-bold uppercase"
              style={{ color: theme.textSecondary }}
            >
              Date
            </Text>
            <Text className="font-medium" style={{ color: theme.textPrimary }}>
              {header.date}
            </Text>
          </View>

          {/* Status Badge - Only for Commercial */}
          {isCommercial ? (
            <View className="items-end">
              <View
                className="px-2 py-1 rounded border"
                style={{
                  backgroundColor: statusInfo.bg,
                  borderColor: statusInfo.border,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: statusInfo.text }}
                >
                  {statusInfo.label}
                </Text>
              </View>
            </View>
          ) : (
            <View className="items-end">
              <View
                className="px-2 py-1 rounded border"
                style={{
                  backgroundColor: theme.sectionBg,
                  borderColor: theme.border,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: theme.textSecondary }}
                >
                  N/A
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* FINANCIAL SUMMARY ROW (Only if Commercial) */}
        {isCommercial && (
          <View
            className="flex-row justify-between p-2 rounded border items-center"
            style={{
              backgroundColor: theme.sectionBg,
              borderColor: theme.subtleBorder,
            }}
          >
            <View>
              <Text
                className="text-[10px] font-bold uppercase"
                style={{ color: theme.textSecondary }}
              >
                Payment Method
              </Text>
              <Text className="font-bold" style={{ color: theme.textPrimary }}>
                {header.paymentMethod}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="items-end">
                <Text
                  className="text-[10px] font-bold uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  Amount Paid
                </Text>
                <Text
                  className="font-bold"
                  style={{ color: theme.successText }}
                >
                  ₱{(header.paidAmount || 0).toFixed(2)}
                </Text>
              </View>

              {/* Mark As Paid Button (Only visible if not fully paid) */}
              {!isFullyPaid && (
                <Pressable
                  onPress={handleMarkAsPaid}
                  className="bg-green-600 px-3 py-2 rounded-md flex-row items-center gap-1 active:bg-green-700 shadow-sm"
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
            <View
              className="flex-1 p-3 rounded border justify-center"
              style={{
                backgroundColor: theme.sectionBg,
                borderColor: theme.border,
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase mb-2 border-b pb-1"
                style={{
                  color: theme.textSecondary,
                  borderBottomColor: theme.subtleBorder,
                }}
              >
                Client Details
              </Text>
              <View className="mb-2">
                <Text
                  className="text-[10px] font-bold uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  Name
                </Text>
                <Text
                  className="font-bold text-sm leading-4"
                  style={{ color: theme.textPrimary }}
                >
                  {header.clientName || "-"}
                </Text>
              </View>
              <View>
                <Text
                  className="text-[10px] font-bold uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  Company
                </Text>
                <Text
                  className="text-sm leading-4"
                  style={{ color: theme.textPrimary }}
                >
                  {header.clientAffiliation || "N/A"}
                </Text>
              </View>
            </View>

            {/* Right Column: Logistics Info (2x2 Grid) */}
            <View
              className="flex-1 p-3 rounded border"
              style={{
                backgroundColor: theme.orangeBg,
                borderColor: theme.orangeBorder,
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase mb-2 border-b pb-1"
                style={{
                  color: theme.orangeText,
                  borderBottomColor: theme.orangeBorder,
                }}
              >
                Logistics Info
              </Text>

              <View className="flex-1 justify-between">
                {/* Row 1: Driver | Weight */}
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-2">
                    <Text
                      className="text-[10px] font-bold uppercase"
                      style={{ color: theme.orangeText, opacity: 0.8 }}
                    >
                      Driver
                    </Text>
                    <Text
                      className="text-xs font-bold"
                      style={{ color: theme.textPrimary }}
                      numberOfLines={1}
                    >
                      {header.driverName}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-[10px] font-bold uppercase"
                      style={{ color: theme.orangeText, opacity: 0.8 }}
                    >
                      Weight
                    </Text>
                    <Text
                      className="text-xs font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {header.truckWeight} kg
                    </Text>
                  </View>
                </View>

                {/* Row 2: Plate | Button */}
                <View className="flex-row justify-between items-end">
                  <View className="flex-1 mr-2">
                    <Text
                      className="text-[10px] font-bold uppercase"
                      style={{ color: theme.orangeText, opacity: 0.8 }}
                    >
                      Plate
                    </Text>
                    <Text
                      className="text-xs font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {header.truckPlate}
                    </Text>
                  </View>

                  {header.licenseImageUri && (
                    <Pressable
                      onPress={() => setModalVisible(true)}
                      className="border rounded-md px-3 py-2 flex-row items-center shadow-sm"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.orangeText,
                      }}
                    >
                      <Camera size={16} color={theme.orangeText} />
                      <Text
                        className="text-[10px] font-bold ml-1 uppercase"
                        style={{ color: theme.orangeText }}
                      >
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
          <View
            className="p-4 rounded border"
            style={{
              backgroundColor: theme.sectionBg,
              borderColor: theme.border,
            }}
          >
            <Text
              className="text-[10px] font-bold uppercase mb-2 border-b pb-1"
              style={{
                color: theme.textSecondary,
                borderBottomColor: theme.subtleBorder,
              }}
            >
              Client Details
            </Text>
            <View className="flex-row justify-between items-center">
              {/* Left: Name */}
              <View className="flex-1">
                <Text
                  className="text-[10px] font-bold uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  Name
                </Text>
                <Text
                  className="font-bold text-lg"
                  style={{ color: theme.textPrimary }}
                >
                  {header.clientName || "-"}
                </Text>
              </View>

              {/* Right: Company */}
              <View className="flex-1 items-end">
                <Text
                  className="text-[10px] font-bold uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  Company
                </Text>
                <Text
                  className="font-medium text-lg"
                  style={{ color: theme.textPrimary }}
                >
                  {header.clientAffiliation || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {/* --- TABLE --- */}
      <View
        className="flex-1 rounded-lg border overflow-hidden"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        <View
          className="flex-row p-3 items-center"
          style={{ backgroundColor: theme.headerBg }}
        >
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
              className="flex-row items-center p-3 border-b"
              style={{
                backgroundColor: index % 2 === 0 ? theme.rowEven : theme.rowOdd,
                borderBottomColor: theme.subtleBorder,
              }}
            >
              <Text
                className="flex-[2] font-medium text-sm"
                style={{ color: theme.textPrimary }}
              >
                {item.material}
              </Text>
              <Text
                className="flex-1 text-center text-sm"
                style={{ color: theme.textSecondary }}
              >
                {item.weight} {item.uom}
              </Text>
              <Text
                className="flex-1 text-center text-sm"
                style={{ color: theme.textSecondary }}
              >
                ₱{item.price}
              </Text>
              <Text className="flex-1 text-blue-700 dark:text-blue-400 text-center font-bold text-sm">
                ₱{item.subtotal.toFixed(2)}
              </Text>
            </View>
          )}
        />
      </View>

      {/* --- FOOTER --- */}
      <View className="h-14 flex-row items-center justify-between gap-3">
        <View
          className="px-4 py-2 border rounded-md flex-1 justify-center"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          <Text
            className="font-bold text-xs uppercase"
            style={{ color: theme.textSecondary }}
          >
            Total Amount
          </Text>
          <Text className="font-bold text-blue-700 dark:text-blue-400 text-lg">
            ₱{grandTotal.toFixed(2)}
          </Text>
        </View>
        <Pressable
          onPress={handlePrint}
          className="bg-amber-500 w-14 h-full rounded-lg items-center justify-center active:bg-amber-600"
        >
          <Printer size={24} color="white" />
        </Pressable>
        {/* <Pressable
          onPress={() => router.back()}
          className="bg-blue-600 w-14 h-full rounded-lg items-center justify-center active:bg-blue-700"
        >
          <ChevronLeft size={24} color="white" />
        </Pressable> */}
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
