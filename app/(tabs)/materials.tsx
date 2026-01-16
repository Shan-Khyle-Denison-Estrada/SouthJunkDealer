import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, X } from "lucide-react-native";
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from 'drizzle-orm';
import { materials } from '../../db/schema';
import { db } from './_layout';

// --- REUSABLE PICKER ---
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

export default function MaterialIndex() {
    // --- STATE ---
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    // Data State
    const [materialsData, setMaterialsData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Form States
    const [materialName, setMaterialName] = useState("");
    const [materialClass, setMaterialClass] = useState(null);
    const [uom, setUom] = useState(null);
    // REMOVED: maxCap state

    const classOptions = [
        { label: "Class A (High Value)", value: "A" },
        { label: "Class B (Mid Value)", value: "B" },
        { label: "Class C (Low Value)", value: "C" },
    ];

    const uomOptions = [
        { label: "Kilograms (kg)", value: "kg" },
        { label: "Pounds (lbs)", value: "lbs" },
        { label: "Tons", value: "ton" },
        { label: "Units / Pieces", value: "units" },
    ];

    // --- DATA FETCHING ---
    const loadData = async () => {
        try {
            const data = await db.select().from(materials);
            setMaterialsData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
            Alert.alert("Error", "Failed to load materials");
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // --- SEARCH LOGIC ---
    const filteredMaterials = materialsData.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
            item.name.toLowerCase().includes(query) ||
            item.id.toString().includes(query) ||
            (item.class && item.class.toLowerCase().includes(query))
        );
    });

    // --- CRUD ACTIONS ---
    const handleAddMaterial = async () => {
        try {
            if (!materialName) { Alert.alert("Error", "Material Name is required"); return; }
            if (!materialClass) { Alert.alert("Error", "Class is required"); return; }
            if (!uom) { Alert.alert("Error", "UoM is required"); return; }

            await db.insert(materials).values({
                name: materialName,
                class: materialClass,
                uom: uom,
                // REMOVED: maxCap
            });

            setAddModalVisible(false);
            resetForm();
            loadData();
        } catch (error) {
            Alert.alert("Database Error", error.message);
        }
    };

    const handleUpdateMaterial = async () => {
        if (!selectedMaterial) return;
        try {
            await db.update(materials)
                .set({
                    name: materialName,
                    class: materialClass,
                    uom: uom,
                    // REMOVED: maxCap
                })
                .where(eq(materials.id, selectedMaterial.id));

            setEditModalVisible(false);
            resetForm();
            loadData();
        } catch (error) {
            Alert.alert("Database Error", error.message);
        }
    };

    const handleDeleteMaterial = async () => {
        if (!selectedMaterial) return;
        try {
            await db.delete(materials).where(eq(materials.id, selectedMaterial.id));
            setEditModalVisible(false);
            resetForm();
            loadData();
        } catch (error) {
            Alert.alert("Database Error", error.message);
        }
    };

    const handleRowClick = (item) => {
        setSelectedMaterial(item);
        setMaterialName(item.name);
        setMaterialClass(item.class);
        setUom(item.uom);
        // REMOVED: setMaxCap
        setEditModalVisible(true);
    };

    const resetForm = () => {
        setMaterialName("");
        setMaterialClass(null);
        setUom(null);
        // REMOVED: setMaxCap
        setSelectedMaterial(null);
    };

    return (
        <View className="flex-1 bg-gray-100 p-4 gap-4">

            {/* --- ADD MODAL --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={addModalVisible}
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <Text className="text-xl font-bold text-gray-800">New Material</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-gray-700 font-bold mb-1">Material Name</Text>
                                <TextInput 
                                    className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300" 
                                    placeholder="Ex: Copper Wire" 
                                    value={materialName}
                                    onChangeText={setMaterialName}
                                />
                            </View>
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-gray-700 font-bold mb-1">Class</Text>
                                    <View className="h-12">
                                        <CustomPicker selectedValue={materialClass} onValueChange={setMaterialClass} placeholder="Select..." items={classOptions} />
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-700 font-bold mb-1">UoM</Text>
                                    <View className="h-12">
                                        <CustomPicker selectedValue={uom} onValueChange={setUom} placeholder="Select..." items={uomOptions} />
                                    </View>
                                </View>
                            </View>
                            {/* REMOVED: Max Capacity Input View */}
                        </View>

                        <View className="mt-6 flex-row gap-3">
                            <TouchableOpacity onPress={() => setAddModalVisible(false)} className="flex-1 bg-red-600 p-3 rounded-md items-center">
                                <Text className="font-bold text-white">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddMaterial} className="flex-1 bg-green-600 p-3 rounded-md items-center">
                                <Text className="font-bold text-white">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- EDIT MODAL --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <Text className="text-xl font-bold text-gray-800">Edit Material: {selectedMaterial?.id}</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                         <View className="gap-4">
                            <View>
                                <Text className="text-gray-700 font-bold mb-1">Material Name</Text>
                                <TextInput 
                                    className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300" 
                                    value={materialName} 
                                    onChangeText={setMaterialName}
                                />
                            </View>
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-gray-700 font-bold mb-1">Class</Text>
                                    <View className="h-12">
                                        <CustomPicker selectedValue={materialClass} onValueChange={setMaterialClass} placeholder="Select..." items={classOptions} />
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-700 font-bold mb-1">UoM</Text>
                                    <View className="h-12">
                                        <CustomPicker selectedValue={uom} onValueChange={setUom} placeholder="Select..." items={uomOptions} />
                                    </View>
                                </View>
                            </View>
                             {/* REMOVED: Max Capacity Input View */}
                        </View>

                        <View className="mt-6 flex-row gap-3">
                            <TouchableOpacity onPress={handleDeleteMaterial} className="flex-1 bg-red-600 p-3 rounded-md items-center flex-row justify-center gap-2">
                                <Trash2 size={20} color="white" />
                                <Text className="font-bold text-white">Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateMaterial} className="flex-1 bg-blue-600 p-3 rounded-md items-center">
                                <Text className="font-bold text-white">Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- TOP BAR (SEARCH & ADD) --- */}
            <View className="flex-[1] flex-row items-center justify-between">
                <View className="w-[45%] h-full flex-row items-center bg-white rounded-md px-3">
                    <Search size={24} color="gray" />
                    <TextInput 
                        placeholder="Search Material..." 
                        className="flex-1 ml-2 text-lg text-gray-700 h-full"
                        style={{ textAlignVertical: 'center' }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <Pressable 
                    className="w-[30%] h-full flex-row items-center justify-center bg-primary rounded-md py-2 active:bg-blue-700" 
                    onPress={() => {
                        resetForm();
                        setAddModalVisible(true);
                    }}
                >
                    <Plus size={24} color="white" />
                    <Text className="text-white text-lg font-bold ml-2">New Material</Text>
                </Pressable>
            </View>

            {/* --- TABLE (FLATLIST) --- */}
            <View className="flex-[12] bg-white rounded-lg overflow-hidden border border-gray-200">
                <View className="flex-row bg-gray-800 p-4">
                    <Text className="flex-1 font-bold text-white text-center text-lg">ID</Text>
                    <Text className="flex-[2] font-bold text-white text-center text-lg">Material Name</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Class</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">UoM</Text>
                    {/* REMOVED: Max Cap Header */}
                    <Text className="flex-1 font-bold text-white text-center text-lg">Total Load</Text>
                </View>

                {filteredMaterials.length === 0 ? (
                    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                         <Text style={{color: '#888'}}>No materials found.</Text>
                         {materialsData.length === 0 ? (
                             <Text style={{color: '#aaa', fontSize: 12, marginTop: 5}}>Try adding a new material.</Text>
                         ) : (
                             <Text style={{color: '#aaa', fontSize: 12, marginTop: 5}}>Try adjusting your search.</Text>
                         )}
                    </View>
                ) : (
                    <FlatList
                        data={filteredMaterials}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item, index }) => (
                            <Pressable 
                                onPress={() => handleRowClick(item)}
                                className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} active:bg-blue-50`}
                            >
                                <Text className="flex-1 text-gray-800 text-center text-lg font-medium">{item.id}</Text>
                                <Text className="flex-[2] text-gray-600 text-center text-lg">{item.name}</Text>
                                <Text className="flex-1 text-gray-600 text-center text-lg">{item.class}</Text>
                                <Text className="flex-1 text-gray-600 text-center text-lg">{item.uom}</Text>
                                {/* REMOVED: Max Cap Data */}
                                <Text className="flex-1 text-blue-700 text-center text-lg font-bold">-</Text>
                            </Pressable>
                        )}
                    />
                )}
            </View>

            <View className="flex-1 flex-row items-center justify-center gap-3">
                <Pressable className="p-3 bg-white border border-gray-300 rounded-md">
                    <ChevronLeft size={24} color="black" />
                </Pressable>
                <View className="px-5 py-3 bg-blue-600 rounded-md">
                    <Text className="text-white text-xl font-bold">1</Text>
                </View>
                <Pressable className="p-3 bg-white border border-gray-300 rounded-md">
                    <ChevronRight size={24} color="black" />
                </Pressable>
            </View>
        </View>
    );
}

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