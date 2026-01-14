import { Picker } from '@react-native-picker/picker';
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// --- REUSABLE PICKER COMPONENT (From editInventory.tsx) ---
const CustomPicker = ({ selectedValue, onValueChange, placeholder, items }) => {
    const [isFocused, setIsFocused] = useState(false);

    const truncate = (str, n) => {
        return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
    };

    return (
        <View style={[styles.pickerContainer, isFocused && styles.pickerFocused]}>
            <View style={styles.visualContainer}>
                <Text
                    style={[styles.pickerText, !selectedValue && styles.placeholderText]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                >
                    {selectedValue
                        ? items.find(i => i.value === selectedValue)?.label || selectedValue
                        : placeholder
                    }
                </Text>
                <View style={styles.arrowContainer}>
                    <View style={[styles.roundedArrow, isFocused && styles.arrowOpen]} />
                </View>
            </View>
            <Picker
                selectedValue={selectedValue}
                onValueChange={(itemValue) => {
                    onValueChange(itemValue);
                    setIsFocused(false);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={styles.invisiblePicker}
                mode="dropdown"
            >
                <Picker.Item label={placeholder} value={null} enabled={false} />
                {items.map((item, index) => (
                    <Picker.Item 
                        key={index} 
                        label={truncate(item.label, 25)} 
                        value={item.value} 
                    />
                ))}
            </Picker>
        </View>
    );
};

export default function MaterialsIndex() {
    // --- STATE MANAGEMENT ---
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [category, setCategory] = useState();
    const [uom, setUom] = useState();
    const [notes, setNotes] = useState("");

    // Dummy Data for Dropdowns
    const categoryItems = [
        { label: "Raw Metal", value: "metal" },
        { label: "Lumber/Wood", value: "wood" },
        { label: "Aggregates", value: "aggregates" },
        { label: "Plumbing", value: "plumbing" },
    ];

    const uomItems = [
        { label: "Pieces (pcs)", value: "pcs" },
        { label: "Kilograms (kg)", value: "kg" },
        { label: "Meters (m)", value: "m" },
        { label: "Bags", value: "bags" },
    ];

    // Dummy data for Materials List
    const materialsData = [
        { id: "M-101", name: "Steel Beams (H-Section)", sku: "ST-2023-A", stock: "450 pcs" },
        { id: "M-102", name: "Portland Cement", sku: "CM-50KG-X", stock: "120 bags" },
        { id: "M-103", name: "Copper Wire (12AWG)", sku: "EL-WR-12", stock: "5,000 m" },
        { id: "M-104", name: "Oak Lumber 2x4", sku: "WD-OAK-24", stock: "0 pcs" },
        { id: "M-105", name: "Insulation Foam", sku: "IN-FM-R13", stock: "200 rolls" },
        { id: "M-106", name: "PVC Piping 3-inch", sku: "PL-PVC-03", stock: "85 lengths" },
    ];

    return (
        <View className="flex-1 bg-gray-100 p-4 gap-4">

            {/* --- MODAL FORM --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                {/* Overlay */}
                <View className="flex-1 bg-black/50 justify-center px-4">
                    {/* Modal Container: Matches editInventory h-3/5 */}
                    <View className="bg-gray-100 h-3/5 rounded-lg p-4 shadow-xl">
                        <View className="flex-1 gap-4">
                            
                            {/* Header */}
                            <Text className="text-xl font-bold text-gray-800">New Material</Text>

                            {/* ROW 1: Name & SKU (Standard Flex Split) */}
                            <View className="flex-1 gap-4 flex-row">
                                <View className="flex-[2]">
                                    <Text className="text-black font-bold mb-1">Material Name</Text>
                                    <TextInput className="bg-white flex-1 rounded-md px-3" placeholder="e.g. Steel Rods" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black font-bold mb-1">SKU</Text>
                                    <TextInput className="bg-white flex-1 rounded-md px-3" placeholder="Auto-Gen" />
                                </View>
                            </View>

                            {/* ROW 2: Category & UOM (Standard Flex Split) */}
                            <View className="flex-1 gap-4 flex-row">
                                <View className="flex-1">
                                    <Text className="text-black font-bold mb-1">Category</Text>
                                    <CustomPicker 
                                        selectedValue={category} 
                                        onValueChange={setCategory} 
                                        placeholder="Select Type..." 
                                        items={categoryItems}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black font-bold mb-1">Unit (UOM)</Text>
                                    <CustomPicker 
                                        selectedValue={uom} 
                                        onValueChange={setUom} 
                                        placeholder="Select Unit..." 
                                        items={uomItems}
                                    />
                                </View>
                            </View>

                            {/* ROW 3: Notes (Takes remaining space) */}
                            <View className="flex-[2]">
                                <Text className="text-black font-bold mb-1">Notes</Text>
                                <TextInput 
                                    className="bg-white flex-1 rounded-md p-3 text-base" 
                                    multiline={true}
                                    textAlignVertical="top"
                                    value={notes}
                                    onChangeText={setNotes}
                                />
                            </View>

                            {/* ROW 4: Buttons (Centered container, standard widths) */}
                            <View className="flex-1 items-center">
                                {/* Using w-1/2 here for the button group to ensure they aren't too wide on large screens, similar to reference w-1/3 */}
                                <View className="w-1/2 h-full gap-4 flex-row">
                                    <TouchableOpacity 
                                        onPress={() => setModalVisible(false)}
                                        className="bg-red-600 flex-1 justify-center items-center rounded-md h-3/4"
                                    >
                                        <Text className="font-semibold text-lg text-white">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => setModalVisible(false)}
                                        className="bg-green-500 flex-1 justify-center items-center rounded-md h-3/4"
                                    >
                                        <Text className="font-semibold text-lg text-white">Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- MAIN INDEX VIEW --- */}
            
            {/* 1. TOP VIEW: Search and Add Button */}
            <View className="flex-[1] flex-row items-center justify-between">
                {/* Standardized Width: 37.5% */}
                <View className="w-[37.5%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
                    <Search size={20} color="gray" />
                    <TextInput 
                        placeholder="Search Material" 
                        className="flex-1 ml-2 text-base text-gray-700"
                    />
                </View>

                {/* Standardized Width: 25% */}
                <Pressable 
                    onPress={() => setModalVisible(true)}
                    className="w-[25%] h-full flex-row items-center justify-center bg-primary rounded-md py-2 active:bg-blue-700"
                >
                    <Plus size={20} color="white" />
                    <Text className="text-white font-medium ml-2">New Material</Text>
                </Pressable>
            </View>

            {/* 2. MIDDLE VIEW: Table */}
            <View className="flex-[12] bg-white rounded-lg overflow-hidden">
                <View className="flex-row bg-gray-200 p-4 border-b border-gray-300">
                    <Text className="flex-1 font-bold text-gray-700">Material Name</Text>
                    <Text className="flex-1 font-bold text-gray-700">SKU / ID</Text>
                    <Text className="flex-1 font-bold text-right text-gray-700">Current Stock</Text>
                </View>

                <View className="flex-1">
                    {materialsData.map((item, index) => (
                        <Pressable 
                            key={index} 
                            className="flex-1 flex-row items-center p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-50"
                        >
                            <Text className="flex-1 text-gray-800 font-medium">{item.name}</Text>
                            <Text className="flex-1 text-gray-500 text-xs uppercase tracking-wider">{item.sku}</Text>
                            <Text className={`flex-1 text-right font-medium ${item.stock.startsWith("0") ? "text-red-500" : "text-gray-800"}`}>
                                {item.stock}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* 3. BOTTOM VIEW: Pagination */}
            <View className="flex-1 flex-row items-center justify-center gap-2">
                <Pressable className="p-2 bg-gray-200 rounded-md">
                    <ChevronLeft size={20} color="gray" />
                </Pressable>
                
                <View className="px-4 py-2 bg-blue-600 rounded-md">
                    <Text className="text-white font-bold">1</Text>
                </View>
                <View className="px-4 py-2 bg-white rounded-md border border-gray-200">
                    <Text className="text-gray-600">2</Text>
                </View>
                <View className="px-4 py-2 bg-white rounded-md border border-gray-200">
                    <Text className="text-gray-600">3</Text>
                </View>

                <Pressable className="p-2 bg-gray-200 rounded-md">
                    <ChevronRight size={20} color="gray" />
                </Pressable>
            </View>
        </View>
    );
}

// --- STYLES (Exact copy from editInventory.tsx) ---
const styles = StyleSheet.create({
    pickerContainer: {
        flex: 1, 
        backgroundColor: 'white',
        borderRadius: 6,
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    pickerFocused: {
        borderColor: '#F2C94C',
    },
    visualContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        height: '100%',
        width: '100%',
    },
    pickerText: {
        fontSize: 16,
        color: 'black',
        flex: 1,
        marginRight: 10,
    },
    placeholderText: {
        color: '#9ca3af',
    },
    arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 20,
        height: 20,
    },
    roundedArrow: {
        width: 10,
        height: 10,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderColor: 'black',
        transform: [{ rotate: '45deg' }],
        marginTop: -4,
        borderRadius: 2,
    },
    arrowOpen: {
        transform: [{ rotate: '225deg' }],
        marginTop: 4,
    },
    invisiblePicker: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
        width: '100%',
        height: '100%'
    }
});