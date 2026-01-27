import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Camera, Check, Edit, Printer } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { inventory, materials } from "../db/schema";

export default function InventoryDetailed() {
  const params = useLocalSearchParams();
  const batchId = params.batchId;
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6", // Gray-100
    card: isDark ? "#1E1E1E" : "#ffffff", // White
    textPrimary: isDark ? "#FFFFFF" : "#1f2937", // Gray-800
    textSecondary: isDark ? "#A1A1AA" : "#6b7280", // Gray-500
    border: isDark ? "#333333" : "#e5e7eb", // Gray-200
    placeholder: isDark ? "#666666" : "#9ca3af", // Gray-400
    buttonDark: isDark ? "#374151" : "#1f2937", // Gray-700 : Gray-800
    blueText: isDark ? "#60a5fa" : "#2563eb", // Blue-400 : Blue-600
  };

  const [batchData, setBatchData] = useState(null);
  const [qrContainerSize, setQrContainerSize] = useState(0);

  // Reference for the QR Code component
  const qrRef = useRef(null);

  const loadBatchDetails = async () => {
    if (!batchId) return;

    try {
      const data = await db
        .select({
          batchId: inventory.batchId,
          date: inventory.date,
          status: inventory.status,
          materialName: materials.name,
          uom: materials.uom,
          imageUri: inventory.imageUri,
          qrContent: inventory.qrContent,
          netWeight: inventory.netWeight,
        })
        .from(inventory)
        .leftJoin(materials, eq(inventory.materialId, materials.id))
        .where(eq(inventory.batchId, batchId));

      if (data.length > 0) {
        setBatchData(data[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load batch details");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBatchDetails();
    }, [batchId]),
  );

  // --- IMAGE UPLOAD HANDLER ---
  const handleUpdatePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Camera access is required to update the photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      try {
        const newUri = result.assets[0].uri;

        await db
          .update(inventory)
          .set({ imageUri: newUri })
          .where(eq(inventory.batchId, batchId));

        loadBatchDetails();
        Alert.alert("Success", "Batch photo updated successfully.");
      } catch (error) {
        console.error("Update photo error:", error);
        Alert.alert("Database Error", "Failed to save the new photo.");
      }
    }
  };

  // --- PRINT FUNCTIONALITY ---
  const handlePrint = async () => {
    if (!batchData || !qrRef.current) return;

    try {
      qrRef.current.toDataURL(async (base64Data) => {
        // Keep CSS hardcoded to black/white for physical paper printing
        const htmlContent = `
                <html>
                  <head>
                    <style>
                      @page { margin: 0; } 
                      body { 
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                        padding: 0; 
                        margin: 0; 
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                      }
                      .label-container {
                        border: 4px solid #000;
                        border-radius: 10px;
                        padding: 30px;
                        text-align: center;
                        width: 400px;
                      }
                      .header { font-size: 24px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
                      .batch-id { font-size: 42px; font-weight: 900; margin: 10px 0; color: #000; }
                      .material { font-size: 28px; color: #2563eb; font-weight: bold; margin-bottom: 20px; }
                      .material-label { color: #000; font-size: 24px; font-weight: normal; margin-right: 5px; }
                      
                      .details { border-top: 2px solid #ccc; border-bottom: 2px solid #ccc; padding: 15px 0; margin: 20px 0; font-size: 20px; display: flex; justify-content: center; }
                      
                      .qr-code { margin-top: 20px; display: flex; justify-content: center; }
                    </style>
                  </head>
                  <body>
                    <div class="label-container">
                      <div class="header">Inventory Tag</div>
                      <div class="batch-id">${batchData.batchId}</div>
                      
                      <div class="material">
                        <span class="material-label">Material:</span>
                        ${batchData.materialName}
                      </div>
                      
                      <div class="details">
                        <span><strong>Date:</strong> ${batchData.date}</span>
                      </div>
    
                      <div class="qr-code">
                        <img src="data:image/png;base64,${base64Data}" width="200" height="200" />
                      </div>
                      <p style="margin-top:10px; font-size: 12px; color: #666;">Scan for Details</p>
                    </div>
                  </body>
                </html>
                `;

        await Print.printAsync({
          html: htmlContent,
        });
      });
    } catch (error) {
      console.error("Print Error:", error);
      Alert.alert("Print Error", "Failed to generate print layout.");
    }
  };

  const handleCheck = () => {
    router.push({
      pathname: "/scannedInventory",
      params: { batchId: batchId },
    });
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "in stock":
        return isDark ? "#4ade80" : "#16a34a"; // green-400 : green-600
      case "processing":
        return isDark ? "#60a5fa" : "#2563eb"; // blue-400 : blue-600
      case "shipped":
        return isDark ? "#9ca3af" : "#6b7280"; // gray-400 : gray-500
      case "sold":
      case "sold out":
        return isDark ? "#f87171" : "#ef4444"; // red-400 : red-500
      default:
        return theme.textPrimary;
    }
  };

  if (!batchData)
    return (
      <View className="flex-1" style={{ backgroundColor: theme.background }} />
    );

  return (
    <View
      className="flex-1 p-4 gap-4"
      style={{ backgroundColor: theme.background }}
    >
      {/* 1. TOP HEADER SECTION */}
      <View
        className="flex-row gap-4 h-24 p-4 rounded-lg border shadow-sm"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        <View className="flex-1 justify-center">
          <Text
            className="text-xs font-bold uppercase"
            style={{ color: theme.textSecondary }}
          >
            Batch ID
          </Text>
          <Text
            className="text-xl font-bold"
            style={{ color: theme.textPrimary }}
          >
            {batchData.batchId}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <Text
            className="text-xs font-bold uppercase"
            style={{ color: theme.textSecondary }}
          >
            Material
          </Text>
          <Text className="text-lg font-bold" style={{ color: theme.blueText }}>
            {batchData.materialName}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <Text
            className="text-xs font-bold uppercase"
            style={{ color: theme.textSecondary }}
          >
            Weight
          </Text>
          <Text
            className="text-lg font-bold"
            style={{ color: theme.textPrimary }}
          >
            {(batchData.netWeight || 0).toFixed(2)} {batchData.uom}
          </Text>
        </View>
        <View className="flex-1 justify-center items-end">
          <Text
            className="text-xs font-bold uppercase"
            style={{ color: theme.textSecondary }}
          >
            Status
          </Text>
          <Text
            className="text-lg font-bold"
            style={{ color: getStatusColor(batchData.status) }}
          >
            {batchData.status}
          </Text>
        </View>
      </View>

      {/* 2. MIDDLE SECTION (Image & QR) */}
      <View className="flex-[10] flex-row gap-4">
        {/* UPDATED: Image Container is now Touchable for updates */}
        <TouchableOpacity
          onPress={handleUpdatePhoto}
          className="flex-[3] rounded-lg border p-2 items-center justify-center overflow-hidden relative"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          {batchData.imageUri ? (
            <>
              <Image
                source={{ uri: batchData.imageUri }}
                style={{
                  width: "100%",
                  height: "100%",
                  resizeMode: "cover",
                  borderRadius: 8,
                  opacity: 0.9,
                }}
              />
              {/* Overlay Icon for Edit indication */}
              <View className="absolute bottom-2 right-2 bg-black/50 p-2 rounded-full">
                <Camera size={20} color="white" />
              </View>
            </>
          ) : (
            <View className="items-center justify-center gap-2">
              <Camera size={40} color={theme.placeholder} />
              <Text
                className="font-semibold"
                style={{ color: theme.placeholder }}
              >
                Tap to Add Photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View
          className="flex-1 rounded-lg border items-center justify-center p-2"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setQrContainerSize(Math.min(width, height) - 20);
          }}
        >
          {batchData.qrContent ? (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white", // QR Codes need white background for contrast
                padding: 4,
                borderRadius: 4,
              }}
            >
              {qrContainerSize > 0 && (
                <QRCode
                  value={batchData.qrContent}
                  size={qrContainerSize}
                  getRef={(c) => (qrRef.current = c)}
                />
              )}
            </View>
          ) : (
            <Text className="text-center" style={{ color: theme.placeholder }}>
              No QR
            </Text>
          )}
        </View>
      </View>

      {/* 3. FOOTER BUTTONS */}
      <View className="h-20 flex-row gap-4 mt-2">
        <Pressable
          onPress={handlePrint}
          className="flex-1 rounded-lg flex-row items-center justify-center gap-2 active:opacity-80"
          style={{ backgroundColor: theme.buttonDark }}
        >
          <Printer size={24} color="white" />
          <Text className="text-white font-bold text-xl">Print QR</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/editInventory",
              params: { batchId: batchId },
            })
          }
          className="flex-1 bg-blue-600 rounded-lg flex-row items-center justify-center gap-2 active:bg-blue-700"
        >
          <Edit size={24} color="white" />
          <Text className="text-white font-bold text-xl">Edit</Text>
        </Pressable>

        <Pressable
          onPress={handleCheck}
          className="flex-1 bg-green-600 rounded-lg flex-row items-center justify-center gap-2 active:bg-green-700"
        >
          <Check size={24} color="white" />
          <Text className="text-white font-bold text-xl">Check</Text>
        </Pressable>
      </View>
    </View>
  );
}
