import { router, useLocalSearchParams } from "expo-router";
import { Camera, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
// Added 'materials' back to the imports
import {
    auditTrails,
    inventory,
    inventoryTransactionItems,
    materials,
    transactionItems,
    transactions,
} from "../db/schema";
import { db } from "./_layout";

const { width } = Dimensions.get("window");

export default function DetailedAuditTrail() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // State for Data
  const [auditDetails, setAuditDetails] = useState(null);
  const [lineItems, setLineItems] = useState([]);

  const loadData = async () => {
    try {
      if (!id) return;

      // 1. Fetch Audit Details + Inventory Batch Info + Material Name
      const auditResult = await db
        .select({
          auditId: auditTrails.id,
          batchId: inventory.batchId,
          materialName: materials.name, // Fetch Material Name
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
        // Re-added join to materials table
        .leftJoin(materials, eq(inventory.materialId, materials.id))
        .where(eq(auditTrails.id, Number(id)));

      if (auditResult.length > 0) {
        const record = auditResult[0];

        // --- PARSE EVIDENCE IMAGES ---
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

        // 2. Fetch Line Items
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
        return "text-green-600";
      case "damaged":
        return "text-red-600";
      case "adjusted":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  // Helper to fix URI issues on Android
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!auditDetails) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-500 text-lg">Audit Record Not Found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 p-3 bg-blue-600 rounded-md"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasImages =
    auditDetails.evidenceImages && auditDetails.evidenceImages.length > 0;

  return (
    <View className="flex-1 px-4 bg-gray-100">
      <View className="flex-1 gap-4 py-4">
        {/* --- HEADER: ID, BATCH(Material), STATUS --- */}
        <View className="flex-row gap-4 h-20">
          <View className="flex-1 justify-center">
            <Text className="text-gray-500 font-bold mb-1 uppercase tracking-widest text-xs">
              Audit ID
            </Text>
            <TextInput
              className="bg-gray-200 rounded-md px-3 h-12 text-lg font-bold text-gray-700 border border-gray-300"
              value={`AUD-${auditDetails.auditId}`}
              editable={false}
            />
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-gray-500 font-bold mb-1 uppercase tracking-widest text-xs">
              Batch ID
            </Text>
            {/* Modified to show Batch ID (Material Name) */}
            <TextInput
              className="bg-gray-200 rounded-md px-3 h-12 text-lg font-bold text-gray-700 border border-gray-300"
              value={`${auditDetails.batchId} (${auditDetails.materialName || "N/A"})`}
              editable={false}
            />
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-gray-600 font-bold mb-1 uppercase tracking-widest text-xs">
              Status
            </Text>
            <View className="bg-white h-12 rounded-md justify-center items-center border border-gray-300">
              <Text
                className={`font-bold text-lg uppercase ${getStatusColor(auditDetails.status)}`}
              >
                {auditDetails.status}
              </Text>
            </View>
          </View>
        </View>

        {/* --- ROW 2: WEIGHTS --- */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-gray-600 font-bold mb-1 text-xs">
              Original Wt.
            </Text>
            <TextInput
              className="bg-gray-200 h-12 rounded-md px-3 text-gray-600 font-medium text-lg border border-gray-300"
              value={
                auditDetails.prevWeight ? `${auditDetails.prevWeight} kg` : "-"
              }
              editable={false}
            />
          </View>
          <View className="flex-1">
            <Text className="text-gray-600 font-bold mb-1 text-xs">
              Adjusted Wt.
            </Text>
            <TextInput
              className={`h-12 rounded-md px-3 font-bold text-lg border ${auditDetails.status === "Adjusted" ? "bg-yellow-50 border-yellow-400 text-blue-700" : "bg-gray-200 border-gray-300 text-gray-400"}`}
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
            <Text className="text-gray-600 font-bold mb-1 text-xs">
              Audit Notes
            </Text>
            <TextInput
              className="bg-white flex-1 rounded-md p-3 text-base border border-gray-300 text-gray-700 leading-5"
              multiline={true}
              editable={false}
              value={auditDetails.notes || "No notes provided."}
              textAlignVertical="top"
            />
          </View>

          {/* Evidence Button */}
          <View className="flex-1">
            <Text className="text-gray-600 font-bold mb-1 text-xs">
              Evidence
            </Text>
            <TouchableOpacity
              onPress={() => hasImages && setImageModalVisible(true)}
              disabled={!hasImages}
              className={`flex-1 rounded-md items-center justify-center border-2 border-dashed ${hasImages ? "bg-blue-50 border-blue-300" : "bg-gray-100 border-gray-300"}`}
            >
              {hasImages ? (
                <>
                  <Camera size={28} color="#2563eb" />
                  <Text className="text-blue-600 font-bold mt-1">
                    View Photos
                  </Text>
                  <Text className="text-blue-400 text-xs">
                    ({auditDetails.evidenceImages.length} items)
                  </Text>
                </>
              ) : (
                <>
                  <Camera size={28} color="#9ca3af" />
                  <Text className="text-gray-400 font-bold mt-1">
                    No Photos
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* --- TABLE SECTION: Source Transactions --- */}
        <View className="flex-1 mt-1">
          <Text className="text-gray-600 font-bold mb-1 text-xs">
            Batch Source History
          </Text>
          <View className="bg-white flex-1 rounded-md border border-gray-200 overflow-hidden">
            <View className="flex-row bg-gray-800 p-3">
              <Text className="flex-1 font-bold text-white text-center text-sm">
                TX ID
              </Text>
              <Text className="flex-1 font-bold text-white text-center text-sm">
                Type
              </Text>
              <Text className="flex-1 font-bold text-white text-center text-sm">
                Date
              </Text>
              <Text className="flex-1 font-bold text-white text-center text-sm">
                Allocated
              </Text>
            </View>

            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {lineItems.length === 0 ? (
                <View className="p-4 items-center">
                  <Text className="text-gray-400 italic">
                    No source transactions found.
                  </Text>
                </View>
              ) : (
                lineItems.map((item, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center p-3 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <Text className="flex-1 text-gray-800 text-center text-xs font-medium">
                      #{item.txId}
                    </Text>
                    <Text className="flex-1 text-blue-700 text-center text-xs font-bold">
                      {item.type}
                    </Text>
                    <Text className="flex-1 text-gray-600 text-center text-xs">
                      {item.date}
                    </Text>
                    <Text className="flex-1 text-gray-600 text-center text-xs">
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
            className="bg-gray-500 flex-1 justify-center items-center rounded-md active:bg-gray-600"
          >
            <Text className="font-semibold text-lg text-white">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-blue-600 flex-1 justify-center items-center rounded-md active:bg-blue-700">
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
