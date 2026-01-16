import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { eq } from 'drizzle-orm';
import { materials, transactionItems } from '../db/schema';
import { db } from './_layout';

export default function NewTransaction() {
    const params = useLocalSearchParams();
    const transactionIdParam = params.transactionId ? Number(params.transactionId) : null;
    const itemIdParam = params.itemId ? Number(params.itemId) : null;

    const [materialsList, setMaterialsList] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState();
    
    const [weight, setWeight] = useState("");
    const [price, setPrice] = useState("");
    const [subtotal, setSubtotal] = useState("0.00");
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        loadMaterials();
        if (itemIdParam) loadExistingItem(itemIdParam);
    }, []);

    useEffect(() => {
        const w = parseFloat(weight) || 0;
        const p = parseFloat(price) || 0;
        setSubtotal((w * p).toFixed(2));
    }, [weight, price]);

    const loadMaterials = async () => {
        const data = await db.select().from(materials);
        setMaterialsList(data.map(m => ({ label: m.name, value: m.id })));
    };

    const loadExistingItem = async (id) => {
        const item = await db.select().from(transactionItems).where(eq(transactionItems.id, id));
        if (item.length > 0) {
            const i = item[0];
            setSelectedMaterial(i.materialId);
            setWeight(i.weight.toString());
            setPrice(i.price.toString());
        }
    };

    const handleSubmit = async () => {
        if (!selectedMaterial || !weight || !price) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        try {
            // Because we now redirect from Transactions -> Summary first,
            // transactionIdParam SHOULD always exist.
            if (!transactionIdParam) {
                Alert.alert("Error", "No Transaction ID found");
                return;
            }

            if (itemIdParam) {
                await db.update(transactionItems).set({
                    materialId: selectedMaterial,
                    weight: parseFloat(weight),
                    price: parseFloat(price),
                    subtotal: parseFloat(subtotal),
                }).where(eq(transactionItems.id, itemIdParam));
            } else {
                await db.insert(transactionItems).values({
                    transactionId: transactionIdParam,
                    materialId: selectedMaterial,
                    weight: parseFloat(weight),
                    price: parseFloat(price),
                    subtotal: parseFloat(subtotal),
                });
            }

            // Go back to summary
            router.back();

        } catch (error) {
            console.error(error);
            Alert.alert("Database Error", error.message);
        }
    };

    const truncate = (str, n) => (str?.length > n) ? str.substr(0, n - 1) + '...' : str;

    return (
        <View className="flex-1 p-4 bg-gray-50">
            <View className="flex-1 flex-col gap-4">
                <View className="flex-[3] gap-4 px-10 pt-10">
                    <Text className="font-bold w-full text-center text-3xl mb-4">
                        {itemIdParam ? "Edit Line Item" : "New Transaction Line Item"}
                    </Text>
                    
                    <View>
                        <Text className="text-lg font-semibold mb-2 ml-1">Material</Text>
                        <View style={[styles.pickerContainer, isFocused && styles.pickerFocused]}>
                            <View style={styles.visualContainer}>
                                <Text style={[styles.pickerText, !selectedMaterial && styles.placeholderText]} numberOfLines={1}>
                                    {selectedMaterial ? materialsList.find(i => i.value === selectedMaterial)?.label : "Select Material..."}
                                </Text>
                                {/* Added Arrow */}
                                <View style={styles.arrowContainer}>
                                    <View style={[styles.roundedArrow, isFocused && styles.arrowOpen]} />
                                </View>
                            </View>
                            <Picker
                                selectedValue={selectedMaterial}
                                onValueChange={(v) => { setSelectedMaterial(v); setIsFocused(false); }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                style={styles.invisiblePicker}
                            >
                                <Picker.Item label="Select Material..." value={null} enabled={false} />
                                {materialsList.map((m, i) => <Picker.Item key={i} label={truncate(m.label, 30)} value={m.value} />)}
                            </Picker>
                        </View>
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-lg font-semibold mb-2 ml-1">Weight (kg)</Text>
                            <TextInput 
                                className="bg-white rounded-md px-4 h-16 border border-gray-300 text-xl"
                                placeholder="0.0" 
                                keyboardType="numeric"
                                value={weight}
                                onChangeText={setWeight}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-lg font-semibold mb-2 ml-1">Price / Unit</Text>
                            <TextInput 
                                className="bg-white rounded-md px-4 h-16 border border-gray-300 text-xl"
                                placeholder="0.00" 
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-lg font-semibold mb-2 ml-1">Subtotal</Text>
                        <View className="bg-gray-200 rounded-md px-4 h-16 border border-gray-300 justify-center">
                            <Text className="text-2xl font-bold text-gray-600">₱ {subtotal}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-4 mt-6">
                        <Pressable onPress={() => router.back()} className="flex-1 bg-red-600 h-16 rounded-lg items-center justify-center">
                            <Text className="text-white font-bold text-xl">Cancel</Text>
                        </Pressable>
                        <Pressable onPress={handleSubmit} className="flex-1 bg-green-600 h-16 rounded-lg items-center justify-center">
                            <Text className="text-white font-bold text-xl">Submit</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  pickerContainer: { height: 64, backgroundColor: 'white', borderRadius: 6, justifyContent: 'center', position: 'relative', overflow: 'hidden', width: '100%', borderWidth: 2, borderColor: 'gray' },
  pickerFocused: { borderColor: '#F2C94C' },
  visualContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: '100%', width: '100%' },
  pickerText: { fontSize: 20, color: 'black', flex: 1 },
  placeholderText: { color: '#9ca3af' },
  invisiblePicker: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, width: '100%', height: '100%' },
  arrowContainer: { justifyContent: 'center', alignItems: 'center', width: 20, height: 20 },
  roundedArrow: { width: 10, height: 10, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'black', transform: [{ rotate: '45deg' }], marginTop: -4, borderRadius: 2 },
  arrowOpen: { transform: [{ rotate: '225deg' }], marginTop: 4 },
});