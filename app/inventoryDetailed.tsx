import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Check, Edit, Printer } from "lucide-react-native";
import React, { useCallback, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from "react-native";
import QRCode from 'react-native-qrcode-svg';

// --- DATABASE IMPORTS ---
import { eq, sql } from 'drizzle-orm';
import { inventory, materials } from '../db/schema';
import { db } from './_layout';

export default function InventoryDetailed() {
    const params = useLocalSearchParams();
    const batchId = params.batchId;

    const [batchData, setBatchData] = useState(null);
    const [qrContainerSize, setQrContainerSize] = useState(0);

    const loadBatchDetails = async () => {
        if (!batchId) return;
        
        try {
            const data = await db.select({
                batchId: inventory.batchId,
                date: inventory.date,
                status: inventory.status,
                materialName: materials.name,
                uom: materials.uom,
                imageUri: inventory.imageUri, 
                qrContent: inventory.qrContent,
                // Calculate weight from linked items
                calculatedWeight: sql`COALESCE((SELECT SUM(allocated_weight) FROM inventory_transaction_items WHERE inventory_transaction_items.inventory_id = inventory.id), 0)`
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
        }, [batchId])
    );

    const handlePrint = () => {
        Alert.alert("Print", "Sending to printer...");
    };

    const handleCheck = () => {
        Alert.alert("Check", "Inventory marked as checked.");
    };

    if (!batchData) return <View className="flex-1 bg-gray-100" />;

    return (
        <View className="flex-1 bg-gray-100 p-4 gap-4">
            
            {/* 1. TOP HEADER SECTION */}
            <View className="flex-row gap-4 h-24 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <View className="flex-1 justify-center">
                    <Text className="text-gray-500 text-xs font-bold uppercase">Batch ID</Text>
                    <Text className="text-xl font-bold text-gray-800">{batchData.batchId}</Text>
                </View>
                <View className="flex-1 justify-center">
                    <Text className="text-gray-500 text-xs font-bold uppercase">Material</Text>
                    <Text className="text-lg font-bold text-blue-600">{batchData.materialName}</Text>
                </View>
                <View className="flex-1 justify-center">
                    <Text className="text-gray-500 text-xs font-bold uppercase">Weight</Text>
                    <Text className="text-lg font-bold text-gray-800">{batchData.calculatedWeight} {batchData.uom}</Text>
                </View>
                <View className="flex-1 justify-center items-end">
                    <Text className="text-gray-500 text-xs font-bold uppercase">Status</Text>
                    <Text className="text-lg font-bold text-green-600">{batchData.status}</Text>
                </View>
            </View>

            {/* 2. MIDDLE SECTION (Image & QR) - 3/4 vs 1/4 Split */}
            <View className="flex-[10] flex-row gap-4">
                
                {/* IMAGE CONTAINER (3/4 Width) */}
                <View className="flex-[3] bg-white rounded-lg border border-gray-200 p-2 items-center justify-center overflow-hidden">
                    {batchData.imageUri ? (
                        <Image 
                            source={{ uri: batchData.imageUri }} 
                            style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 8 }} 
                        />
                    ) : (
                        <Text className="text-gray-400">No Image Available</Text>
                    )}
                </View>

                {/* QR CODE CONTAINER (1/4 Width) */}
                <View 
                    className="flex-1 bg-white rounded-lg border border-gray-200 items-center justify-center p-2"
                    onLayout={(event) => {
                        const { width, height } = event.nativeEvent.layout;
                        setQrContainerSize(Math.min(width, height) - 20); // Calculate max size minus padding
                    }}
                >
                     {batchData.qrContent ? (
                         <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            {qrContainerSize > 0 && (
                                <QRCode 
                                    value={batchData.qrContent} 
                                    size={qrContainerSize} 
                                />
                            )}
                         </View>
                     ) : (
                        <Text className="text-gray-400 text-center">No QR</Text>
                     )}
                </View>
            </View>

            {/* 3. FOOTER BUTTONS (Print, Edit, Check) */}
            <View className="h-20 flex-row gap-4 mt-2">
                <Pressable 
                    onPress={handlePrint}
                    className="flex-1 bg-gray-800 rounded-lg flex-row items-center justify-center gap-2 active:bg-gray-900"
                >
                    <Printer size={24} color="white" />
                    <Text className="text-white font-bold text-xl">Print QR</Text>
                </Pressable>

                {/* --- REDIRECTION TO EDIT INVENTORY --- */}
                <Pressable 
                    onPress={() => router.push({ pathname: '/editInventory', params: { batchId: batchId } })}
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