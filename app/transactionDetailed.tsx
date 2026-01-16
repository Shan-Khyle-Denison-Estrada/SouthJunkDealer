import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from 'drizzle-orm';
import { materials, transactionItems, transactions } from '../db/schema';
import { db } from './_layout';

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
            const txHeader = await db.select().from(transactions).where(eq(transactions.id, transactionId));
            if (txHeader.length > 0) {
                const header = txHeader[0];
                setTransactionType(header.type || "-");
                setPaymentMethod(header.paymentMethod || "-");
                setDate(header.date || "-");
                setStatus(header.status || "-");
                setGrandTotal(header.totalAmount || 0);
            }

            // 2. Fetch Line Items with Material Names
            const items = await db.select({
                id: transactionItems.id,
                material: materials.name,
                weight: transactionItems.weight,
                price: transactionItems.price,
                subtotal: transactionItems.subtotal,
                uom: materials.uom
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
        }, [transactionId])
    );

    return (
        <View className="flex-1 bg-gray-100 p-4 gap-4">
            
            {/* 1. TOP HEADER SECTION (Read-Only Display) */}
            <View className="flex-row gap-4 h-24 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <View className="flex-1 justify-center">
                    <Text className="text-gray-500 text-xs font-bold uppercase">Transaction ID</Text>
                    <Text className="text-xl font-bold text-gray-800">{transactionId}</Text>
                </View>
                <View className="flex-1 justify-center">
                    <Text className="text-gray-500 text-xs font-bold uppercase">Type</Text>
                    <Text className={`text-lg font-bold ${transactionType === 'Selling' ? 'text-green-600' : 'text-blue-600'}`}>
                        {transactionType}
                    </Text>
                </View>
                <View className="flex-1 justify-center">
                    <Text className="text-gray-500 text-xs font-bold uppercase">Payment</Text>
                    <Text className="text-lg font-bold text-gray-800">{paymentMethod}</Text>
                </View>
                <View className="flex-1 justify-center items-end">
                    <Text className="text-gray-500 text-xs font-bold uppercase">Total</Text>
                    <Text className="text-2xl font-bold text-blue-700">₱{grandTotal.toFixed(2)}</Text>
                </View>
            </View>

            {/* 2. TABLE SECTION */}
            <View className="flex-[10] bg-white rounded-lg overflow-hidden border border-gray-200">
                <View className="flex-row bg-gray-800 p-4 items-center">
                    <Text className="flex-1 font-bold text-white text-lg">Line ID</Text>
                    <Text className="flex-[2] font-bold text-white text-lg">Material</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Weight</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Price</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Subtotal</Text>
                </View>

                <FlatList
                    data={lineItems}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item, index }) => (
                        <View className={`flex-row items-center p-4 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <Text className="flex-1 text-gray-800 text-lg font-medium">{item.id}</Text>
                            <Text className="flex-[2] text-gray-800 text-lg font-medium">{item.material}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.weight} {item.uom}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">₱{item.price}</Text>
                            <Text className="flex-1 text-blue-700 text-center text-lg font-bold">₱{item.subtotal.toFixed(2)}</Text>
                        </View>
                    )}
                />
            </View>

            {/* 3. FOOTER (Status & Back Button) */}
            <View className="h-16 flex-row items-center justify-between">
                <View className="px-4 py-2 bg-gray-200 rounded-md">
                     <Text className="font-bold text-gray-600">Status: {status}</Text>
                </View>

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