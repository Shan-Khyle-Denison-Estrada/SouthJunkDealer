import * as Print from "expo-print";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Check, Edit, Printer } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { inventory, materials } from "../db/schema";
import { db } from "./_layout";

export default function InventoryDetailed() {
  const params = useLocalSearchParams();
  const batchId = params.batchId;

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

  // --- PRINT FUNCTIONALITY ---
  const handlePrint = async () => {
    if (!batchData || !qrRef.current) return;

    try {
      // 1. Get Base64 data from the QR Code component
      qrRef.current.toDataURL(async (base64Data) => {
        // 2. Define the HTML for the Label
        const htmlContent = `
                <html>
                  <head>
                    <style>
                      @page { margin: 0; } 
                      body { 
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                        padding: 0; 
                        margin: 0; 
                        /* Center content vertically and horizontally on the page */
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
                      /* Added 'Material:' label styling */
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

        // 3. Send to Printer
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
    switch (status?.toLowerCase()) {
      case "in stock":
        return "text-green-600";
      case "processing":
        return "text-blue-600";
      case "shipped":
        return "text-gray-500";
      case "sold":
        return "text-red-500";
      case "sold out":
        return "text-red-500";
      default:
        return "text-gray-800";
    }
  };

  if (!batchData) return <View className="flex-1 bg-gray-100" />;

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* 1. TOP HEADER SECTION */}
      <View className="flex-row gap-4 h-24 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <View className="flex-1 justify-center">
          <Text className="text-gray-500 text-xs font-bold uppercase">
            Batch ID
          </Text>
          <Text className="text-xl font-bold text-gray-800">
            {batchData.batchId}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-gray-500 text-xs font-bold uppercase">
            Material
          </Text>
          <Text className="text-lg font-bold text-blue-600">
            {batchData.materialName}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-gray-500 text-xs font-bold uppercase">
            Weight
          </Text>
          <Text className="text-lg font-bold text-gray-800">
            {(batchData.netWeight || 0).toFixed(2)} {batchData.uom}
          </Text>
        </View>
        <View className="flex-1 justify-center items-end">
          <Text className="text-gray-500 text-xs font-bold uppercase">
            Status
          </Text>
          <Text
            className={`text-lg font-bold ${getStatusColor(batchData.status)}`}
          >
            {batchData.status}
          </Text>
        </View>
      </View>

      {/* 2. MIDDLE SECTION (Image & QR) */}
      <View className="flex-[10] flex-row gap-4">
        <View className="flex-[3] bg-white rounded-lg border border-gray-200 p-2 items-center justify-center overflow-hidden">
          {batchData.imageUri ? (
            <Image
              source={{ uri: batchData.imageUri }}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: "cover",
                borderRadius: 8,
              }}
            />
          ) : (
            <Text className="text-gray-400">No Image Available</Text>
          )}
        </View>

        <View
          className="flex-1 bg-white rounded-lg border border-gray-200 items-center justify-center p-2"
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setQrContainerSize(Math.min(width, height) - 20);
          }}
        >
          {batchData.qrContent ? (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {qrContainerSize > 0 && (
                <QRCode
                  value={batchData.qrContent}
                  size={qrContainerSize}
                  getRef={(c) => (qrRef.current = c)}
                />
              )}
            </View>
          ) : (
            <Text className="text-gray-400 text-center">No QR</Text>
          )}
        </View>
      </View>

      {/* 3. FOOTER BUTTONS */}
      <View className="h-20 flex-row gap-4 mt-2">
        <Pressable
          onPress={handlePrint}
          className="flex-1 bg-gray-800 rounded-lg flex-row items-center justify-center gap-2 active:bg-gray-900"
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
