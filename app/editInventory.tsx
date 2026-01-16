import { Picker } from '@react-native-picker/picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2, X } from "lucide-react-native";
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// --- DATABASE IMPORTS ---
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { inventory, inventoryTransactionItems, materials, transactionItems, transactions } from '../db/schema';
import { db } from './_layout';

// --- REUSABLE PICKER ---
const CustomPicker = ({ selectedValue, onValueChange, placeholder, items, disabled }) => {
    const [isFocused, setIsFocused] = useState(false);
    const truncate = (str, n) => (str.length > n) ? str.substr(0, n - 1) + '...' : str;

    return (
        <View style={[
            styles.pickerContainer, 
            isFocused && styles.pickerFocused, 
            disabled && { backgroundColor: '#e5e7eb', borderColor: '#d1d5db' }
        ]}>
            <View style={styles.visualContainer}>
                <Text style={[styles.pickerText, !selectedValue && styles.placeholderText, disabled && { color: '#6b7280' }]} numberOfLines={1}>
                    {selectedValue ? items.find(i => i.value === selectedValue)?.label || selectedValue : placeholder}
                </Text>
                {!disabled && (
                    <View style={styles.arrowContainer}>
                        <View style={[styles.roundedArrow, isFocused && styles.arrowOpen]} />
                    </View>
                )}
            </View>
            <Picker
                selectedValue={selectedValue}
                onValueChange={(itemValue) => { if(!disabled) { onValueChange(itemValue); setIsFocused(false); } }}
                onFocus={() => !disabled && setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={styles.invisiblePicker}
                enabled={!disabled}
                mode="dropdown"
            >
                <Picker.Item label={placeholder} value={null} enabled={false} />
                {items.map((item, index) => (
                    <Picker.Item key={index} label={truncate(item.label, 35)} value={item.value} />
                ))}
            </Picker>
        </View>
    );
};

export default function EditInventory() {
    const params = useLocalSearchParams();
    const batchIdParam = params.batchId;

    // --- STATE ---
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isSourcesLoading, setIsSourcesLoading] = useState(false);
    
    // Inventory Data
    const [inventoryRecord, setInventoryRecord] = useState(null);
    const [materialName, setMaterialName] = useState("");
    const [uom, setUom] = useState("");
    const [notes, setNotes] = useState(""); 
    const [netWeight, setNetWeight] = useState("0");

    // List State
    const [linkedItems, setLinkedItems] = useState([]);

    // Available Items for Picker
    const [availableSourceItems, setAvailableSourceItems] = useState([]);
    const [areSourcesLoaded, setAreSourcesLoaded] = useState(false);

    // Modal State
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [selectedSourceId, setSelectedSourceId] = useState(null);
    const [weightToAllocate, setWeightToAllocate] = useState("");
    const [maxAllocatable, setMaxAllocatable] = useState(0);

    // --- 1. LOAD BATCH DATA ---
    const loadBatchData = async () => {
        if (!batchIdParam) return;
        setIsPageLoading(true);

        try {
            // Fetch Batch Info
            const invResult = await db.select().from(inventory).where(eq(inventory.batchId, batchIdParam));
            if (invResult.length === 0) { Alert.alert("Error", "Batch not found"); return router.back(); }
            
            const inv = invResult[0];
            setInventoryRecord(inv);
            setNotes(inv.notes || "");
            // SAFETY CHECK: Ensure netWeight is not undefined
            setNetWeight((inv.netWeight || 0).toFixed(2));
            
            // Fetch Material Name & UOM
            const matResult = await db.select().from(materials).where(eq(materials.id, inv.materialId));
            const mat = matResult.length > 0 ? matResult[0] : { name: "Unknown", uom: "" };
            setMaterialName(mat.name);
            setUom(mat.uom);

            // Fetch Linked Items
            const links = await db.select({
                linkId: inventoryTransactionItems.id,
                txItemId: transactionItems.id,
                txId: transactions.id,
                date: transactions.date,
                allocated: inventoryTransactionItems.allocatedWeight,
                totalOriginal: transactionItems.weight
            })
            .from(inventoryTransactionItems)
            .leftJoin(transactionItems, eq(inventoryTransactionItems.transactionItemId, transactionItems.id))
            .leftJoin(transactions, eq(transactionItems.transactionId, transactions.id))
            .where(eq(inventoryTransactionItems.inventoryId, inv.id))
            .orderBy(asc(transactions.date)); 
            
            // --- FIFO CALCULATION ---
            const totalOriginalAllocated = links.reduce((sum, item) => sum + (item.allocated || 0), 0);
            const currentNetWeight = inv.netWeight || 0;
            
            // Amount lost/sold/shrunk
            let lostWeight = Math.max(0, totalOriginalAllocated - currentNetWeight);

            const linksWithRemaining = links.map(item => {
                let remaining = item.allocated || 0;
                
                if (lostWeight > 0) {
                    const deduction = Math.min(remaining, lostWeight);
                    remaining -= deduction;
                    lostWeight -= deduction;
                }
                
                return { ...item, remaining };
            });

            setLinkedItems(linksWithRemaining);
            setAreSourcesLoaded(false); 

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load batch data");
        } finally {
            setIsPageLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadBatchData();
        }, [batchIdParam])
    );

    // --- 2. LOAD SOURCES ---
    const loadAvailableSources = async () => {
        if (areSourcesLoaded || !inventoryRecord) return;
        setIsSourcesLoading(true);

        try {
            const recentItems = await db.select({
                itemId: transactionItems.id,
                txId: transactions.id,
                weight: transactionItems.weight,
                date: transactions.date
            })
            .from(transactionItems)
            .leftJoin(transactions, eq(transactionItems.transactionId, transactions.id))
            .where(eq(transactionItems.materialId, inventoryRecord.materialId))
            .orderBy(desc(transactionItems.id))
            .limit(500);

            if (recentItems.length === 0) {
                setAvailableSourceItems([]);
                setAreSourcesLoaded(true);
                setIsSourcesLoading(false);
                return;
            }

            const itemIds = recentItems.map(i => i.itemId);
            
            const allocations = await db.select({
                itemId: inventoryTransactionItems.transactionItemId,
                allocated: inventoryTransactionItems.allocatedWeight
            })
            .from(inventoryTransactionItems)
            .where(inArray(inventoryTransactionItems.transactionItemId, itemIds));

            const usageMap = {};
            allocations.forEach(row => {
                usageMap[row.itemId] = (usageMap[row.itemId] || 0) + (row.allocated || 0);
            });

            const options = recentItems
                .map(item => {
                    const used = usageMap[item.itemId] || 0;
                    const remaining = (item.weight || 0) - used;
                    return {
                        label: `TX-${item.txId} (Line: ${item.itemId}) - Avail: ${remaining.toFixed(2)}kg`, 
                        value: item.itemId,
                        remaining: remaining
                    };
                })
                .filter(item => item.remaining > 0.01);

            setAvailableSourceItems(options);
            setAreSourcesLoaded(true);

        } catch (error) {
            console.error("Failed to load sources", error);
        } finally {
            setIsSourcesLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsAddModalVisible(true);
        setTimeout(() => loadAvailableSources(), 100);
    };

    // --- ACTIONS ---
    const handleAddLineItem = async () => {
        if (!selectedSourceId || !weightToAllocate) return Alert.alert("Error", "Missing fields");
        const val = parseFloat(weightToAllocate);
        if (isNaN(val) || val <= 0 || val > maxAllocatable + 0.001) return Alert.alert("Error", "Invalid weight");

        try {
            await db.transaction(async (tx) => {
                await tx.insert(inventoryTransactionItems).values({
                    inventoryId: inventoryRecord.id,
                    transactionItemId: selectedSourceId,
                    allocatedWeight: val
                });

                await tx.update(inventory)
                    .set({ netWeight: sql`${inventory.netWeight} + ${val}` })
                    .where(eq(inventory.id, inventoryRecord.id));
            });

            setIsAddModalVisible(false);
            setWeightToAllocate("");
            loadBatchData(); 
        } catch (e) { Alert.alert("Error", e.message); }
    };

    const handleDeleteItem = async (linkId, allocatedAmount) => {
        try {
             await db.transaction(async (tx) => {
                await tx.delete(inventoryTransactionItems).where(eq(inventoryTransactionItems.id, linkId));
                
                await tx.update(inventory)
                    .set({ netWeight: sql`MAX(0, ${inventory.netWeight} - ${allocatedAmount})` })
                    .where(eq(inventory.id, inventoryRecord.id));
             });

            loadBatchData();
        } catch (e) { Alert.alert("Error", e.message); }
    };

    const confirmDelete = (linkId, amount) => {
        Alert.alert("Remove Item", "This will reduce the batch weight.", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => handleDeleteItem(linkId, amount) }
        ]);
    }

    const handleSubmit = async () => {
        router.back();
    };

    const handleSourceChange = (val) => {
        setSelectedSourceId(val);
        const item = availableSourceItems.find(i => i.value === val);
        if (item) {
            setMaxAllocatable(item.remaining);
            setWeightToAllocate(item.remaining.toString());
        }
    };

    if (isPageLoading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563EB"/></View>;

    return (
        <View className="flex-1 px-4 py-4 justify-start gap-4 bg-gray-50">
            {/* SECTION 1: HEADER */}
            <View className="bg-white rounded-md p-4 shadow-sm border border-gray-200">
                <Text className="text-lg font-bold text-gray-800 mb-3">Inventory Batch Details</Text>
                
                <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                        <Text className="text-gray-700 font-bold mb-1 text-xs">Batch ID</Text>
                        <TextInput 
                            className="bg-gray-100 rounded-md px-3 h-12 border border-gray-200 text-sm text-gray-500" 
                            value={inventoryRecord?.batchId} 
                            editable={false} 
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-700 font-bold mb-1 text-xs">Material</Text>
                        <View className="h-12 bg-gray-100 rounded-md border border-gray-200 justify-center px-3">
                             <Text className="text-gray-500 text-sm" numberOfLines={1}>{materialName}</Text>
                        </View>
                    </View>
                    
                    <View className="flex-1">
                        <Text className="text-gray-700 font-bold mb-1 text-xs">Net Weight</Text>
                        <TextInput 
                            className="bg-yellow-100 rounded-md px-3 h-12 border border-yellow-300 text-sm text-blue-800 font-extrabold" 
                            value={`${netWeight} ${uom}`} 
                            editable={false} 
                        />
                    </View>
                </View>

                <View>
                    <Text className="text-gray-700 font-bold mb-1 text-xs">Notes</Text>
                    <TextInput 
                        className="bg-gray-50 rounded-md p-3 h-24 text-sm border border-gray-200" 
                        multiline={true} 
                        numberOfLines={4} 
                        textAlignVertical="top" 
                        value={notes} 
                        onChangeText={setNotes} 
                        placeholder="Optional remarks..." 
                    />
                </View>                
           </View>

            {/* SECTION 2: ITEMS */}
            <View className="flex-1 bg-white rounded-md border border-gray-200 overflow-hidden">
                <View className="flex-row bg-gray-800 p-3 items-center">
                    <Text className="flex-1 font-bold text-white text-center text-xs">Line ID</Text>
                    <Text className="flex-1 font-bold text-white text-center text-xs">Tx Date</Text>
                    <Text className="flex-1 font-bold text-white text-center text-xs">Original</Text>
                    <Text className="flex-[1.5] font-bold text-white text-center text-xs">Avail / Alloc</Text>
                    <TouchableOpacity onPress={handleOpenAddModal} className="w-8 items-center justify-center bg-blue-600 rounded-sm h-6">
                        <Plus size={16} color="white" />
                    </TouchableOpacity>
                </View>
                <ScrollView className="flex-1">
                    {linkedItems.length === 0 ? (
                        <View className="p-8 items-center"><Text className="text-gray-400 italic">No items linked.</Text></View>
                    ) : (
                        linkedItems.map((item, index) => (
                            <View key={item.linkId} className={`flex-row items-center p-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <Text className="flex-1 text-gray-800 text-center text-xs font-medium">{item.txItemId}</Text>
                                <Text className="flex-1 text-gray-600 text-center text-xs">{item.date}</Text>
                                <Text className="flex-1 text-gray-600 text-center text-xs">{item.totalOriginal} {uom}</Text>
                                
                                {/* SAFETY CHECK: Handle potentially undefined/null remaining value */}
                                <Text className={`flex-[1.5] text-center text-xs font-bold ${item.remaining === 0 ? 'text-red-400' : 'text-blue-700'}`}>
                                    {(item.remaining || 0).toFixed(2)} / {item.allocated}
                                </Text>
                                
                                <TouchableOpacity onPress={() => confirmDelete(item.linkId, item.allocated)} className="w-8 items-center justify-center">
                                    <Trash2 size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* SECTION 3: ACTIONS */}
            <View className="h-16 flex-row gap-4 mb-2">
                 <TouchableOpacity onPress={() => router.back()} className="bg-red-600 flex-1 justify-center items-center rounded-md"><Text className="font-semibold text-xl text-white">Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} className="bg-green-600 flex-1 justify-center items-center rounded-md"><Text className="font-semibold text-xl text-white">Done</Text></TouchableOpacity>
            </View>

            {/* MODAL */}
            <Modal animationType="fade" transparent={true} visible={isAddModalVisible} onRequestClose={() => setIsAddModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
                        <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <Text className="text-lg font-bold text-gray-800">Add Transaction Item</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}><X size={24} color="#9ca3af" /></TouchableOpacity>
                        </View>
                        <Text className="text-gray-500 mb-4 text-xs">Select source of type <Text className="font-bold text-black">{materialName}</Text>.</Text>
                        
                        <View className="mb-4">
                            <Text className="text-gray-700 font-bold mb-1">Source Item</Text>
                            <View className="h-12 justify-center">
                                {isSourcesLoading ? (
                                    <View className="flex-row items-center justify-center bg-gray-100 h-full rounded-md border border-gray-200">
                                        <ActivityIndicator size="small" color="#2563EB" />
                                        <Text className="ml-2 text-gray-500">Finding available items...</Text>
                                    </View>
                                ) : (
                                    <CustomPicker 
                                        selectedValue={selectedSourceId} 
                                        onValueChange={handleSourceChange} 
                                        placeholder={availableSourceItems.length > 0 ? "Select..." : "No items available"} 
                                        items={availableSourceItems} 
                                        disabled={availableSourceItems.length === 0} 
                                    />
                                )}
                            </View>
                        </View>
                        
                        <View className="mb-6">
                            <Text className="text-gray-700 font-bold mb-1">Allocate Weight ({uom})</Text>
                            <Text className="text-xs text-gray-400 mb-1">Max: {maxAllocatable.toFixed(2)} {uom}</Text>
                            <TextInput className="bg-gray-100 rounded-md p-3 text-lg border border-gray-300 text-center font-bold text-blue-600" keyboardType="numeric" value={weightToAllocate} onChangeText={setWeightToAllocate} placeholder="0.00" />
                        </View>
                        <View className="flex-row gap-3">
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)} className="flex-1 bg-gray-200 p-3 rounded-md items-center"><Text className="font-bold text-gray-700">Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleAddLineItem} className="flex-1 bg-blue-600 p-3 rounded-md items-center"><Text className="font-bold text-white">Add</Text></TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    pickerContainer: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 6, justifyContent: 'center', position: 'relative', overflow: 'hidden', width: '100%', borderWidth: 1, borderColor: '#e5e7eb' },
    pickerFocused: { borderColor: '#F2C94C', backgroundColor: 'white', borderWidth: 2 },
    visualContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: '100%', width: '100%' },
    pickerText: { fontSize: 14, color: 'black', flex: 1, marginRight: 10 },
    placeholderText: { color: '#9ca3af' },
    arrowContainer: { justifyContent: 'center', alignItems: 'center', width: 20, height: 20 },
    roundedArrow: { width: 10, height: 10, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'black', transform: [{ rotate: '45deg' }], marginTop: -4, borderRadius: 2 },
    arrowOpen: { transform: [{ rotate: '225deg' }], marginTop: 4 },
    invisiblePicker: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, width: '100%', height: '100%' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', width: '100%', maxWidth: 400, borderRadius: 12, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }
});