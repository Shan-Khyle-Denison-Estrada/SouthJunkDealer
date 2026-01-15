import { Picker } from '@react-native-picker/picker';
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, X } from "lucide-react-native";
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// --- REUSABLE PICKER COMPONENT ---
const CustomPicker = ({ selectedValue, onValueChange, placeholder, items }) => {
    const [isFocused, setIsFocused] = useState(false);
    const truncate = (str, n) => (str.length > n) ? str.substr(0, n - 1) + '...' : str;

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
    // --- STATE MANAGEMENT ---
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    // Form States
    const [materialName, setMaterialName] = useState("");
    const [materialClass, setMaterialClass] = useState();
    const [uom, setUom] = useState();
    const [maxCap, setMaxCap] = useState("");

    // --- DUMMY DATA ---
    // Columns: ID, Material Name, Class, UoM, Max Capacity, Total Load
    const materialsData = [
        { id: "MAT-001", name: "Copper Wire", class: "A", uom: "kg", maxCap: "5,000", totalLoad: "450" },
        { id: "MAT-002", name: "Aluminum Cans", class: "B", uom: "kg", maxCap: "2,000", totalLoad: "120.5" },
        { id: "MAT-003", name: "PET Bottles", class: "C", uom: "kg", maxCap: "10,000", totalLoad: "890" },
        { id: "MAT-004", name: "Steel Scraps", class: "A", uom: "ton", maxCap: "50", totalLoad: "2.1" },
        { id: "MAT-005", name: "Cardboard", class: "B", uom: "kg", maxCap: "3,000", totalLoad: "350" },
        { id: "MAT-006", name: "Glass Bottles", class: "C", uom: "units", maxCap: "20,000", totalLoad: "500" },
    ];

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

    // --- HANDLERS ---
    const handleRowClick = (item) => {
        setSelectedMaterial(item);
        // Pre-fill form for editing
        setMaterialName(item.name);
        setMaterialClass(item.class);
        setUom(item.uom);
        setMaxCap(item.maxCap);
        setEditModalVisible(true);
    };

    const resetForm = () => {
        setMaterialName("");
        setMaterialClass(null);
        setUom(null);
        setMaxCap("");
    };

    return (
        <View className="flex-1 bg-gray-100 p-4 gap-4">

            {/* --- 1. ADD NEW MATERIAL MODAL --- */}
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

                        {/* Form Fields */}
                        <View className="gap-4">
                            <View>
                                <Text className="text-gray-700 font-bold mb-1">Material Name</Text>
                                <TextInput className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300" placeholder="Ex: Copper Wire" />
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
                            <View>
                                <Text className="text-gray-700 font-bold mb-1">Max Capacity</Text>
                                <TextInput className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300" placeholder="0" keyboardType="numeric" />
                            </View>
                        </View>

                        <View className="mt-6 flex-row gap-3">
                            <TouchableOpacity onPress={() => setAddModalVisible(false)} className="flex-1 bg-red-600 p-3 rounded-md items-center">
                                <Text className="font-bold text-white">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)} className="flex-1 bg-green-600 p-3 rounded-md items-center">
                                <Text className="font-bold text-white">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- 2. EDIT / DELETE MODAL --- */}
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

                         {/* Form Fields (Pre-filled) */}
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
                            <View>
                                <Text className="text-gray-700 font-bold mb-1">Max Capacity</Text>
                                <TextInput 
                                    className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300" 
                                    value={maxCap}
                                    onChangeText={setMaxCap} 
                                    keyboardType="numeric" 
                                />
                            </View>
                        </View>

                        <View className="mt-6 flex-row gap-3">
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} className="flex-1 bg-red-600 p-3 rounded-md items-center flex-row justify-center gap-2">
                                <Trash2 size={20} color="white" />
                                <Text className="font-bold text-white">Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} className="flex-1 bg-blue-600 p-3 rounded-md items-center">
                                <Text className="font-bold text-white">Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 3. TOP VIEW: Search and Add Button */}
            <View className="flex-[1] flex-row items-center justify-between">
                <View className="w-[45%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
                    <Search size={24} color="gray" />
                    <TextInput 
                        placeholder="Search Material..." 
                        className="flex-1 ml-2 text-lg text-gray-700"
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

            {/* 4. MIDDLE VIEW: Table (Static, Consistent Design) */}
            <View className="flex-[12] bg-white rounded-lg overflow-hidden border border-gray-200">
                {/* Table Header */}
                <View className="flex-row bg-gray-800 p-4">
                    <Text className="flex-1 font-bold text-white text-center text-lg">ID</Text>
                    <Text className="flex-[2] font-bold text-white text-center text-lg">Material Name</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Class</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">UoM</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Max Cap</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Total Load</Text>
                </View>

                {/* Table Body */}
                <View className="flex-1">
                    {materialsData.map((item, index) => (
                        <Pressable 
                            key={index} 
                            onPress={() => handleRowClick(item)}
                            className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} active:bg-blue-50`}
                        >
                            <Text className="flex-1 text-gray-800 text-center text-lg font-medium">{item.id}</Text>
                            <Text className="flex-[2] text-gray-600 text-center text-lg">{item.name}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.class}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.uom}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.maxCap}</Text>
                            <Text className="flex-1 text-blue-700 text-center text-lg font-bold">{item.totalLoad}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* 5. BOTTOM VIEW: Pagination */}
            <View className="flex-1 flex-row items-center justify-center gap-3">
                <Pressable className="p-3 bg-white border border-gray-300 rounded-md">
                    <ChevronLeft size={24} color="black" />
                </Pressable>
                
                <View className="px-5 py-3 bg-blue-600 rounded-md">
                    <Text className="text-white text-xl font-bold">1</Text>
                </View>
                <View className="px-5 py-3 bg-white rounded-md border border-gray-300">
                    <Text className="text-gray-600 text-xl">2</Text>
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