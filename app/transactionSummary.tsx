import { Picker } from '@react-native-picker/picker';
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Edit, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from 'drizzle-orm';
import { materials, transactionItems, transactions } from '../db/schema';
import { db } from './_layout';

// --- PICKER WITH ARROW ---
const SummaryPicker = ({ selectedValue, onValueChange, placeholder, items }) => (
    <View style={styles.pickerContainer}>
        <View style={styles.visualContainer}>
            <Text style={[styles.pickerText, !selectedValue && styles.placeholderText]}>
                {selectedValue || placeholder}
            </Text>
            {/* Added Arrow */}
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
            {items.map((i, idx) => <Picker.Item key={idx} label={i} value={i} />)}
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

    const loadTransactionData = async () => {
        if (!transactionId) return;

        // Fetch Header to populate Dropdowns
        const txHeader = await db.select().from(transactions).where(eq(transactions.id, transactionId));
        if (txHeader.length > 0) {
            setTransactionType(txHeader[0].type);
            setPaymentMethod(txHeader[0].paymentMethod);
        }

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
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);
        setGrandTotal(total);
    };

    useFocusEffect(
        useCallback(() => {
            loadTransactionData();
        }, [transactionId])
    );

    // --- AUTO SAVE HEADER CHANGES ---
    const updateHeader = async (field, value) => {
        // 1. Update State UI
        if (field === 'type') setTransactionType(value);
        if (field === 'payment') setPaymentMethod(value);

        // 2. Persist to DB immediately
        try {
            await db.update(transactions)
                .set({ 
                    [field === 'type' ? 'type' : 'paymentMethod']: value 
                })
                .where(eq(transactions.id, transactionId));
        } catch (e) {
            console.error("Failed to persist header", e);
        }
    }

    const handleDeleteItem = async (itemId) => {
        Alert.alert("Delete Item", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    await db.delete(transactionItems).where(eq(transactionItems.id, itemId));
                    loadTransactionData();
                }
            }
        ]);
    };

    const handleEditItem = (itemId) => {
        router.push({
            pathname: '/newTransaction',
            params: { transactionId: transactionId, itemId: itemId }
        });
    };

    const handleDone = async () => {
        if (!transactionType || !paymentMethod) {
            Alert.alert("Error", "Please select Transaction Type and Payment Method");
            return;
        }
        try {
            await db.update(transactions).set({
                totalAmount: grandTotal,
                status: 'Completed'
            }).where(eq(transactions.id, transactionId));

            router.navigate('/(tabs)/transactions');
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <View className="flex-1 bg-gray-100 p-4 gap-4">
            <View className="flex-row gap-4 h-24">
                <View className="flex-1">
                    <Text className="mb-1 font-bold text-gray-700">Type</Text>
                    {/* Updates DB on change */}
                    <SummaryPicker 
                        selectedValue={transactionType} 
                        onValueChange={(v) => updateHeader('type', v)} 
                        placeholder="Select Type" 
                        items={["Buying", "Selling"]} 
                    />
                </View>
                <View className="flex-1">
                    <Text className="mb-1 font-bold text-gray-700">Payment</Text>
                    {/* Updates DB on change */}
                    <SummaryPicker 
                        selectedValue={paymentMethod} 
                        onValueChange={(v) => updateHeader('payment', v)} 
                        placeholder="Select Method" 
                        items={["Cash", "G-Cash", "Bank Transfer"]} 
                    />
                </View>
                <View className="flex-1 items-end justify-center">
                    <Text className="text-gray-500 font-bold">Total Amount</Text>
                    <Text className="text-3xl font-bold text-blue-700">₱{grandTotal.toFixed(2)}</Text>
                </View>
            </View>

            <View className="flex-[10] bg-white rounded-lg overflow-hidden border border-gray-200">
                <View className="flex-row bg-gray-800 p-4 items-center">
                    <Text className="flex-[2] font-bold text-white text-lg">Material</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Weight</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Price</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Subtotal</Text>
                    <Text className="w-24 font-bold text-white text-center text-lg">Actions</Text>
                </View>

                <FlatList
                    data={lineItems}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item, index }) => (
                        <View className={`flex-row items-center p-4 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <Text className="flex-[2] text-gray-800 text-lg font-medium">{item.material}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.weight} {item.uom}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">₱{item.price}</Text>
                            <Text className="flex-1 text-blue-700 text-center text-lg font-bold">₱{item.subtotal.toFixed(2)}</Text>
                            
                            <View className="w-24 flex-row justify-center gap-3">
                                <Pressable onPress={() => handleEditItem(item.id)} className="p-2 bg-yellow-100 rounded-md">
                                    <Edit size={20} color="#d97706" />
                                </Pressable>
                                <Pressable onPress={() => handleDeleteItem(item.id)} className="p-2 bg-red-100 rounded-md">
                                    <Trash2 size={20} color="#dc2626" />
                                </Pressable>
                            </View>
                        </View>
                    )}
                />
            </View>

            <View className="h-20 flex-row gap-4 mt-2">
                <Pressable onPress={() => router.push({ pathname: '/newTransaction', params: { transactionId } })} className="flex-1 bg-blue-600 rounded-lg flex-row items-center justify-center gap-2">
                    <Plus size={24} color="white" />
                    <Text className="text-white font-bold text-xl">Add Item</Text>
                </Pressable>
                <Pressable className="flex-1 bg-primary rounded-lg items-center justify-center">
                    <Text className="text-white font-bold text-xl">Print</Text>
                </Pressable>
                <Pressable onPress={handleDone} className="flex-1 bg-green-600 rounded-lg items-center justify-center">
                    <Text className="text-white font-bold text-xl">Done</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    pickerContainer: { height: 50, backgroundColor: 'white', borderRadius: 6, justifyContent: 'center', position: 'relative', overflow: 'hidden', width: '100%', borderWidth: 1, borderColor: '#d1d5db' },
    visualContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: '100%', width: '100%' },
    pickerText: { fontSize: 16, color: 'black', flex: 1 },
    placeholderText: { color: '#9ca3af' },
    invisiblePicker: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, width: '100%', height: '100%' },
    arrowContainer: { justifyContent: 'center', alignItems: 'center', width: 20, height: 20 },
    roundedArrow: { width: 10, height: 10, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'black', transform: [{ rotate: '45deg' }], marginTop: -4, borderRadius: 2 },
});