import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
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

const { width } = Dimensions.get("window");

export default function DetailedAuditTrail() {
  const { id } = useLocalSearchParams();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6",
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937",
    textSecondary: isDark ? "#A1A1AA" : "#4b5563",
    border: isDark ? "#333333" : "#d1d5db",
    subtleBorder: isDark ? "#2C2C2C" : "#f3f4f6",
    inputBg: isDark ? "#2C2C2C" : "#e5e7eb",
    inputText: isDark ? "#FFFFFF" : "#374151",
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    headerBg: isDark ? "#0f0f0f" : "#1f2937",
    primary: "#2563eb",
    success: isDark ? "#4ade80" : "#16a34a",
    danger: isDark ? "#f87171" : "#dc2626",
    info: isDark ? "#60a5fa" : "#2563eb",
    warningBg: isDark ? "#422006" : "#fffbeb",
    warningBorder: isDark ? "#a16207" : "#facc15",
  };

  const [loading, setLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [auditDetails, setAuditDetails] = useState(null);
  const [lineItems, setLineItems] = useState([]);

  const loadData = async () => {
    try {
      if (!id) return;

      const auditResult = await db
        .select({
          auditId: auditTrails.id,
          batchId: inventory.batchId,
          materialName: materials.name,
          status: auditTrails.action,
          notes: auditTrails.notes,
          date: auditTrails.date,
          evidenceUri: auditTrails.evidenceImageUri,
          prevWeight: auditTrails.previousWeight,
          newWeight: auditTrails.newWeight,
          inventoryId: auditTrails.inventoryId,
        })
        .from(auditTrails)
        .leftJoin(inventory, eq(auditTrails.inventoryId, inventory.id))
        .leftJoin(materials, eq(inventory.materialId, materials.id))
        .where(eq(auditTrails.id, Number(id)));

      if (auditResult.length > 0) {
        const record = auditResult[0];

        let images = [];
        if (record.evidenceUri) {
          try {
            const parsed = JSON.parse(record.evidenceUri);
            if (Array.isArray(parsed)) images = parsed;
            else images = [record.evidenceUri];
          } catch (e) {
            images = [record.evidenceUri];
          }
        }

        setAuditDetails({ ...record, evidenceImages: images });

        const invId = record.inventoryId;
        const items = await db
          .select({
            id: inventoryTransactionItems.id,
            txId: transactions.id,
            type: transactions.type,
            date: transactions.date,
            allocated: inventoryTransactionItems.allocatedWeight,
          })
          .from(inventoryTransactionItems)
          .leftJoin(
            transactionItems,
            eq(
              inventoryTransactionItems.transactionItemId,
              transactionItems.id,
            ),
          )
          .leftJoin(
            transactions,
            eq(transactionItems.transactionId, transactions.id),
          )
          .where(eq(inventoryTransactionItems.inventoryId, invId));

        setLineItems(items);
      }
    } catch (e) {
      console.error("Failed to load details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return theme.success;
      case "damaged":
        return theme.danger;
      case "adjusted":
        return theme.info;
      default:
        return theme.textSecondary;
    }
  };

  const getCleanUri = (uri) => {
    if (!uri) return null;
    if (
      uri.startsWith("file://") ||
      uri.startsWith("http") ||
      uri.startsWith("content://")
    ) {
      return uri;
    }
    return `file://${uri}`;
  };

  // --- HELPER: Convert Image to Base64 ---
  const convertImageToBase64 = async (uri) => {
    try {
      if (!uri) return null;
      if (uri.startsWith("http")) return uri;

      const cleanUri = getCleanUri(uri);
      const base64 = await FileSystem.readAsStringAsync(cleanUri, {
        encoding: "base64",
      });

      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.warn("Failed to convert image to base64:", error);
      return uri;
    }
  };

  // --- PRINT FUNCTIONALITY ---
  const handlePrint = async () => {
    if (!auditDetails) return;

    try {
      // 1. Generate Rows for Table
      const tableRows = lineItems
        .map(
          (item) => `
        <tr>
          <td>#${item.txId}</td>
          <td>${item.type}</td>
          <td>${item.date}</td>
          <td style="text-align: right;">${item.allocated} kg</td>
        </tr>
      `,
        )
        .join("");

      // 2. Prepare Images
      let imagesHtml = "";
      if (
        auditDetails.evidenceImages &&
        auditDetails.evidenceImages.length > 0
      ) {
        const imagePromises = auditDetails.evidenceImages.map((uri) =>
          convertImageToBase64(uri),
        );
        const processedImages = await Promise.all(imagePromises);

        imagesHtml = `
          <div class="section" style="page-break-inside: avoid;">
            <div class="section-title">Evidence Photos</div>
            <div class="image-grid">
              ${processedImages
                .filter((src) => src !== null)
                .map(
                  (src, index) => `
                <div class="image-card">
                   <img src="${src}" />
                   <div class="image-caption">Evidence #${index + 1}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `;
      }

      // 3. Construct Full HTML
      // OPTIMIZATIONS: Tighter margins, smaller fonts, compact padding
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              @page {
                margin: 10mm; /* Reduced from 20mm to save space */
                size: A4;
              }
              body { 
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                color: #333; 
                margin: 0;
                padding: 0;
                font-size: 12px; /* Slightly smaller base font */
                -webkit-print-color-adjust: exact;
              }
              
              /* COMPACT HEADER */
              .header { 
                text-align: center; 
                margin-bottom: 15px; 
                border-bottom: 1px solid #333; 
                padding-bottom: 5px; 
              }
              .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
              .header p { margin: 2px 0 0; color: #666; font-size: 10px; }
              
              /* COMPACT SECTIONS */
              .section { margin-bottom: 15px; page-break-inside: avoid; }
              .section-title { 
                font-size: 14px; 
                font-weight: bold; 
                margin-bottom: 8px; 
                border-left: 3px solid #2563eb; 
                padding-left: 8px; 
                text-transform: uppercase; 
                background-color: #f9fafb;
                padding-top: 2px;
                padding-bottom: 2px;
              }
              
              /* GRID LAYOUT */
              .grid { display: flex; flex-wrap: wrap; gap: 15px; }
              .grid-item { flex: 1; min-width: 120px; }
              .label { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 2px; }
              .value { font-size: 13px; font-weight: bold; }
              
              .status-box { 
                display: inline-block; 
                padding: 2px 8px; 
                border-radius: 4px; 
                border: 1px solid #333; 
                font-size: 12px;
              }
              
              /* COMPACT TABLE */
              table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
              th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; text-transform: uppercase; font-size: 10px; }
              tr:nth-child(even) { background-color: #f9fafb; }
              
              /* COMPACT IMAGE GRID */
              .image-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 5px;
              }
              .image-card {
                background: #fff;
                border: 1px solid #e5e7eb;
                padding: 5px;
                border-radius: 6px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                display: flex;
                flex-direction: column;
                align-items: center;
                page-break-inside: avoid;
              }
              .image-card img {
                width: 100%;
                height: 160px; /* Reduced height to fit more */
                object-fit: contain;
                border-radius: 3px;
                background-color: #f9fafb;
              }
              .image-caption {
                margin-top: 4px;
                font-size: 10px;
                font-weight: bold;
                color: #6b7280;
                text-transform: uppercase;
              }

              /* FOOTER */
              .footer { 
                margin-top: 20px; 
                text-align: center; 
                font-size: 9px; 
                color: #999; 
                border-top: 1px solid #eee; 
                padding-top: 5px; 
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Audit Trail Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="section">
              <div class="section-title">Record Details</div>
              <div class="grid">
                <div class="grid-item">
                  <div class="label">Audit ID</div>
                  <div class="value">AUD-${auditDetails.auditId}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Batch ID</div>
                  <div class="value">${auditDetails.batchId}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Material</div>
                  <div class="value">${auditDetails.materialName || "N/A"}</div>
                </div>
                 <div class="grid-item">
                  <div class="label">Status</div>
                  <div class="value status-box">${auditDetails.status}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Weight & Adjustments</div>
              <div class="grid">
                <div class="grid-item">
                  <div class="label">Recorded Date</div>
                  <div class="value">${auditDetails.date}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Original Weight</div>
                  <div class="value">${auditDetails.prevWeight ? auditDetails.prevWeight + " kg" : "-"}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Adjusted/New Weight</div>
                  <div class="value">${auditDetails.newWeight ? auditDetails.newWeight + " kg" : "-"}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Auditor Notes</div>
              <div style="background: #f9fafb; padding: 10px; border-radius: 4px; border: 1px solid #eee; min-height: 40px; font-size: 12px;">
                ${auditDetails.notes || "No notes recorded."}
              </div>
            </div>
            
            ${imagesHtml}

            <div class="section">
              <div class="section-title">Source Transaction History</div>
              ${
                lineItems.length > 0
                  ? `
                <table>
                  <thead>
                    <tr>
                      <th>TX ID</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th style="text-align: right;">Allocated</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                  </tbody>
                </table>
              `
                  : '<p style="font-style: italic; color: #666; font-size: 11px;">No source transactions found.</p>'
              }
            </div>

            <div class="footer">
              <p>End of Report | Internal Use Only</p>
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({
        html,
      });
    } catch (error) {
      console.error("Print Error:", error);
      Alert.alert("Export Error", "Failed to generate print layout.");
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!auditDetails) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.background }}
      >
        <Text style={{ color: theme.textSecondary, fontSize: 18 }}>
          Audit Record Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 p-3 rounded-md"
          style={{ backgroundColor: theme.primary }}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasImages =
    auditDetails.evidenceImages && auditDetails.evidenceImages.length > 0;

  return (
    <View className="flex-1 px-4" style={{ backgroundColor: theme.background }}>
      <View className="flex-1 gap-4 py-4">
        {/* --- HEADER: ID, BATCH(Material), STATUS --- */}
        <View className="flex-row gap-4 h-20">
          <View className="flex-1 justify-center">
            <Text
              className="font-bold mb-1 uppercase tracking-widest text-xs"
              style={{ color: theme.textSecondary }}
            >
              Audit ID
            </Text>
            <TextInput
              className="rounded-md px-3 h-12 text-lg font-bold border"
              style={{
                backgroundColor: theme.inputBg,
                color: theme.inputText,
                borderColor: theme.border,
              }}
              value={`AUD-${auditDetails.auditId}`}
              editable={false}
            />
          </View>
          <View className="flex-1 justify-center">
            <Text
              className="font-bold mb-1 uppercase tracking-widest text-xs"
              style={{ color: theme.textSecondary }}
            >
              Batch ID
            </Text>
            <TextInput
              className="rounded-md px-3 h-12 text-lg font-bold border"
              style={{
                backgroundColor: theme.inputBg,
                color: theme.inputText,
                borderColor: theme.border,
              }}
              value={`${auditDetails.batchId} (${auditDetails.materialName || "N/A"})`}
              editable={false}
            />
          </View>
          <View className="flex-1 justify-center">
            <Text
              className="font-bold mb-1 uppercase tracking-widest text-xs"
              style={{ color: theme.textSecondary }}
            >
              Status
            </Text>
            <View
              className="h-12 rounded-md justify-center items-center border"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <Text
                className="font-bold text-lg uppercase"
                style={{ color: getStatusColor(auditDetails.status) }}
              >
                {auditDetails.status}
              </Text>
            </View>
          </View>
        </View>

        {/* --- ROW 2: WEIGHTS --- */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text
              className="font-bold mb-1 text-xs"
              style={{ color: theme.textSecondary }}
            >
              Original Wt.
            </Text>
            <TextInput
              className="h-12 rounded-md px-3 font-medium text-lg border"
              style={{
                backgroundColor: theme.inputBg,
                color: theme.textSecondary,
                borderColor: theme.border,
              }}
              value={
                auditDetails.prevWeight ? `${auditDetails.prevWeight} kg` : "-"
              }
              editable={false}
            />
          </View>
          <View className="flex-1">
            <Text
              className="font-bold mb-1 text-xs"
              style={{ color: theme.textSecondary }}
            >
              Adjusted Wt.
            </Text>
            <TextInput
              className="h-12 rounded-md px-3 font-bold text-lg border"
              style={
                auditDetails.status === "Adjusted"
                  ? {
                      backgroundColor: theme.warningBg,
                      borderColor: theme.warningBorder,
                      color: theme.info,
                    }
                  : {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.textSecondary,
                    }
              }
              value={
                auditDetails.newWeight ? `${auditDetails.newWeight} kg` : "-"
              }
              editable={false}
            />
          </View>
        </View>

        {/* --- ROW 3: NOTES & EVIDENCE BUTTON --- */}
        <View className="flex-row gap-4 h-32">
          {/* Notes Area */}
          <View className="flex-[1.5]">
            <Text
              className="font-bold mb-1 text-xs"
              style={{ color: theme.textSecondary }}
            >
              Audit Notes
            </Text>
            <TextInput
              className="flex-1 rounded-md p-3 text-base border leading-5"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.inputText,
              }}
              multiline={true}
              editable={false}
              value={auditDetails.notes || "No notes provided."}
              textAlignVertical="top"
            />
          </View>

          {/* Evidence Button */}
          <View className="flex-1">
            <Text
              className="font-bold mb-1 text-xs"
              style={{ color: theme.textSecondary }}
            >
              Evidence
            </Text>
            <TouchableOpacity
              onPress={() => hasImages && setImageModalVisible(true)}
              disabled={!hasImages}
              className="flex-1 rounded-md items-center justify-center border-2 border-dashed"
              style={
                hasImages
                  ? {
                      backgroundColor: theme.highlightBg,
                      borderColor: theme.primary,
                    }
                  : {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                    }
              }
            >
              {hasImages ? (
                <>
                  <Camera size={28} color={theme.primary} />
                  <Text
                    className="font-bold mt-1"
                    style={{ color: theme.primary }}
                  >
                    View Photos
                  </Text>
                  <Text className="text-xs" style={{ color: theme.primary }}>
                    ({auditDetails.evidenceImages.length} items)
                  </Text>
                </>
              ) : (
                <>
                  <Camera size={28} color={theme.placeholder} />
                  <Text
                    className="font-bold mt-1"
                    style={{ color: theme.placeholder }}
                  >
                    No Photos
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* --- TABLE SECTION: Source Transactions --- */}
        <View className="flex-1 mt-1">
          <Text
            className="font-bold mb-1 text-xs"
            style={{ color: theme.textSecondary }}
          >
            Batch Source History
          </Text>
          <View
            className="flex-1 rounded-md border overflow-hidden"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
            }}
          >
            <View
              className="flex-row p-3"
              style={{ backgroundColor: theme.headerBg }}
            >
              <Text
                className="flex-1 font-bold text-center text-sm"
                style={{ color: "#fff" }}
              >
                TX ID
              </Text>
              <Text
                className="flex-1 font-bold text-center text-sm"
                style={{ color: "#fff" }}
              >
                Type
              </Text>
              <Text
                className="flex-1 font-bold text-center text-sm"
                style={{ color: "#fff" }}
              >
                Date
              </Text>
              <Text
                className="flex-1 font-bold text-center text-sm"
                style={{ color: "#fff" }}
              >
                Allocated
              </Text>
            </View>

            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {lineItems.length === 0 ? (
                <View className="p-4 items-center">
                  <Text className="italic" style={{ color: theme.placeholder }}>
                    No source transactions found.
                  </Text>
                </View>
              ) : (
                lineItems.map((item, index) => (
                  <View
                    key={index}
                    className="flex-row items-center p-3 border-b"
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? theme.rowEven : theme.rowOdd,
                      borderBottomColor: theme.subtleBorder,
                    }}
                  >
                    <Text
                      className="flex-1 text-center text-xs font-medium"
                      style={{ color: theme.textPrimary }}
                    >
                      #{item.txId}
                    </Text>
                    <Text
                      className="flex-1 text-center text-xs font-bold"
                      style={{ color: theme.primary }}
                    >
                      {item.type}
                    </Text>
                    <Text
                      className="flex-1 text-center text-xs"
                      style={{ color: theme.textSecondary }}
                    >
                      {item.date}
                    </Text>
                    <Text
                      className="flex-1 text-center text-xs"
                      style={{ color: theme.textSecondary }}
                    >
                      {item.allocated} kg
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* --- ACTION BUTTONS --- */}
        <View className="h-16 flex-row gap-4 mb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-1 justify-center items-center rounded-md active:bg-gray-600"
            style={{ backgroundColor: theme.textSecondary }}
          >
            <Text className="font-semibold text-lg text-white">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePrint}
            className="flex-1 justify-center items-center rounded-md active:bg-blue-700"
            style={{ backgroundColor: theme.primary }}
          >
            <Text className="font-semibold text-lg text-white">
              Export Report
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- IMAGE CAROUSEL MODAL --- */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View className="flex-1 bg-black justify-center items-center">
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setImageModalVisible(false)}
            className="absolute top-12 right-6 z-50 p-2 bg-gray-800 rounded-full"
          >
            <X color="white" size={24} />
          </TouchableOpacity>

          {/* Carousel ScrollView */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: "center" }}
          >
            {auditDetails?.evidenceImages?.map((uri, index) => (
              <View
                key={index}
                style={{
                  width: width,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={{ uri: getCleanUri(uri) }}
                  style={{ width: width, height: "80%" }}
                  resizeMode="contain"
                  onError={(e) =>
                    console.log("Error loading image:", e.nativeEvent.error)
                  }
                />
                <Text className="text-white mt-4 font-bold text-lg">
                  {index + 1} / {auditDetails.evidenceImages.length}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
