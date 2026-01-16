import { Picker } from '@react-native-picker/picker';
import { router, useFocusEffect } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react-native";
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// --- DATABASE IMPORTS ---
import { desc, eq } from 'drizzle-orm';
import { inventory, materials } from '../../db/schema';
import { db } from './_layout';

// --- REUSABLE PICKER (KEPT AS IS) ---
const CustomPicker = ({ selectedValue, onValueChange, placeholder, items }) => {
    const [isFocused, setIsFocused] = useState(false);
    const truncate = (str, n) => (str?.length > n) ? str.substr(0, n - 1) + '...' : str;

    return (
        <View style={[styles.pickerContainer, isFocused && styles.pickerFocused]}>
            <View style={styles.visualContainer}>
                <Text style={[styles.pickerText, !selectedValue && styles.placeholderText]} numberOfLines={1}>
                    {selectedValue ? items.find(i => i.value === selectedValue)?.label || selectedValue : placeholder}
                </Text>
                <View style={styles.arrowContainer}>
                    <View style={[styles.roundedArrow, isFocused && styles.arrowOpen]} />
                </View>
            </View>
            <Picker
                selectedValue={selectedValue}
                onValueChange={(v) => { onValueChange(v); setIsFocused(false); }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={styles.invisiblePicker}
                mode="dropdown"
            >
                <Picker.Item label={placeholder} value={null} enabled={false} />
                {items.map((item, index) => (
                    <Picker.Item key={index} label={truncate(item.label, 25)} value={item.value} />
                ))}
            </Picker>
        </View>
    );
};

export default function InventoryIndex() {
    // --- STATE ---
    const [modalVisible, setModalVisible] = useState(false);
    
    // Data State
    const [inventoryData, setInventoryData] = useState([]);
    const [materialOptions, setMaterialOptions] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Form State
    const [selectedMaterialId, setSelectedMaterialId] = useState(null);
    const [netWeight, setNetWeight] = useState("");

    // --- DATA FETCHING ---
    const loadData = async () => {
        try {
            // 1. Fetch Materials for the Dropdown
            const materialsList = await db.select().from(materials);
            const options = materialsList.map(m => ({ label: m.name, value: m.id }));
            setMaterialOptions(options);

            // 2. Fetch Inventory (Joined with Materials to get names)
            const invList = await db.select({
                id: inventory.id,
                batchId: inventory.batchId,
                netWeight: inventory.netWeight,
                date: inventory.date,
                status: inventory.status,
                materialName: materials.name, // Get name from relation
                uom: materials.uom
            })
            .from(inventory)
            .leftJoin(materials, eq(inventory.materialId, materials.id))
            .orderBy(desc(inventory.id)); // Newest first

            setInventoryData(invList);

        } catch (error) {
            console.error("Error loading data:", error);
            Alert.alert("Error", "Failed to load inventory");
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // --- SEARCH LOGIC ---
    const filteredInventory = inventoryData.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
            item.batchId.toLowerCase().includes(query) ||
            (item.materialName && item.materialName.toLowerCase().includes(query)) ||
            item.status.toLowerCase().includes(query)
        );
    });

    // --- ADD INVENTORY BATCH ---
    const handleSaveBatch = async () => {
        if (!selectedMaterialId) { Alert.alert("Error", "Please select a material"); return; }
        if (!netWeight) { Alert.alert("Error", "Please enter weight"); return; }

        try {
            // Generate a random Batch ID (e.g., BATCH-4821-X)
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const generatedBatchId = `BATCH-${randomSuffix}-A`; 

            // Current Date
            const today = new Date().toISOString().split('T')[0];

            await db.insert(inventory).values({
                batchId: generatedBatchId,
                materialId: selectedMaterialId,
                netWeight: parseFloat(netWeight),
                date: today,
                status: 'In Stock' // Default status
            });

            setModalVisible(false);
            setNetWeight("");
            setSelectedMaterialId(null);
            loadData(); // Refresh list

        } catch (error) {
            console.error("Save failed:", error);
            Alert.alert("Database Error", error.message);
        }
    };

    // Helper for Status Color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'in stock': return 'text-green-600';
            case 'processing': return 'text-blue-600';
            case 'shipped': return 'text-gray-500';
            default: return 'text-gray-800';
        }
    };

    return (
        <View className="flex-1 bg-gray-100 p-4 gap-4">

            {/* --- ADD MODAL --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <Text className="text-xl font-bold text-gray-800">New Inventory Batch</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-gray-700 font-bold mb-1">Material Category</Text>
                                <View className="h-12">
                                    {/* POPULATED FROM DB */}
                                    <CustomPicker 
                                        selectedValue={selectedMaterialId} 
                                        onValueChange={setSelectedMaterialId} 
                                        placeholder="Select Material..." 
                                        items={materialOptions}
                                    />
                                </View>
                            </View>
                            
                            <View>
                                <Text className="text-gray-700 font-bold mb-1">Net Weight</Text>
                                <TextInput 
                                    className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300" 
                                    placeholder="0.00" 
                                    keyboardType="numeric"
                                    value={netWeight}
                                    onChangeText={setNetWeight}
                                />
                            </View>
                        </View>

                        <View className="mt-6 flex-row gap-3">
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 bg-red-600 p-3 rounded-md items-center">
                                <Text className="font-bold text-white">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveBatch} className="flex-1 bg-green-600 p-3 rounded-md items-center">
                                <Text className="font-bold text-white">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            {/* 1. TOP VIEW: Search and Add Button */}
            <View className="flex-[1] flex-row items-center justify-between">
                <View className="w-[45%] h-full flex-row items-center bg-white rounded-md px-3">
                    <Search size={20} color="gray" />
                    <TextInput 
                        placeholder="Search Batch..." 
                        className="flex-1 ml-2 text-base text-gray-700 h-full"
                        style={{ textAlignVertical: 'center' }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View className="flex-row gap-2 h-full">
                    <Pressable 
                        onPress={() => setModalVisible(true)}
                        className="px-4 h-full flex-row items-center justify-center bg-primary rounded-md active:bg-blue-700"
                    >
                        <Plus size={24} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">New Batch</Text>
                    </Pressable>
                </View>
            </View>

            {/* 2. MIDDLE VIEW: Inventory Table */}
            <View className="flex-[12] bg-white rounded-lg overflow-hidden border border-gray-200">
                <View className="flex-row bg-gray-800 p-4">
                    <Text className="flex-1 font-bold text-white text-center text-lg">Batch ID</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Material</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Net Weight</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Date</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Status</Text>
                </View>

                {filteredInventory.length === 0 ? (
                    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                         <Text style={{color: '#888'}}>No inventory found.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredInventory}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item, index }) => (
                            <Pressable 
                                onPress={() => router.push('/inventoryDetailed')} // Disabled for now until detail page exists
                                className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} active:bg-blue-50`}
                            >
                                <Text className="flex-1 text-gray-800 text-center text-lg font-medium">{item.batchId}</Text>
                                <Text className="flex-1 text-gray-600 text-center text-lg">{item.materialName || 'Unknown'}</Text>
                                <Text className="flex-1 text-gray-600 text-center text-lg">
                                    {item.netWeight} {item.uom || ''}
                                </Text>
                                <Text className="flex-1 text-gray-600 text-center text-lg">{item.date}</Text>
                                <Text className={`flex-1 text-center text-lg font-bold ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </Text>
                            </Pressable>
                        )}
                    />
                )}
            </View>

            {/* 3. BOTTOM VIEW: Pagination */}
            <View className="flex-1 flex-row items-center justify-center gap-2">
                <Pressable className="p-2 bg-gray-200 rounded-md">
                    <ChevronLeft size={20} color="gray" />
                </Pressable>
                <View className="px-4 py-2 bg-blue-600 rounded-md">
                    <Text className="text-white font-bold">1</Text>
                </View>
                <Pressable className="p-2 bg-gray-200 rounded-md">
                    <ChevronRight size={20} color="gray" />
                </Pressable>
            </View>
        </View>
    );
}

// --- STYLES (Kept exactly as original) ---
const styles = StyleSheet.create({
    pickerContainer: { flex: 1, backgroundColor: 'white', borderRadius: 6, justifyContent: 'center', position: 'relative', overflow: 'hidden', width: '100%', borderWidth: 2, borderColor: 'transparent' },
    pickerFocused: { borderColor: '#F2C94C' },
    visualContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: '100%', width: '100%' },
    pickerText: { fontSize: 16, color: 'black', flex: 1, marginRight: 10 },
    placeholderText: { color: '#9ca3af' },
    arrowContainer: { justifyContent: 'center', alignItems: 'center', width: 20, height: 20 },
    roundedArrow: { width: 10, height: 10, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'black', transform: [{ rotate: '45deg' }], marginTop: -4, borderRadius: 2 },
    arrowOpen: { transform: [{ rotate: '225deg' }], marginTop: 4 },
    invisiblePicker: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, width: '100%', height: '100%' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', width: '50%', borderRadius: 12, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }
});