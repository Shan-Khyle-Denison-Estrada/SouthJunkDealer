import { Picker } from '@react-native-picker/picker';
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, ClipboardCheck, Package, Plus, Search } from "lucide-react-native";
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// --- REUSABLE PICKER COMPONENT ---
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

export default function InventoryIndex() {
    // --- STATE MANAGEMENT ---
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [selectedItem, setSelectedItem] = useState();
    const [location, setLocation] = useState();
    const [notes, setNotes] = useState("");

    // Dummy Data for Form Dropdowns
    const itemOptions = [
        { label: "Wireless Mouse (PER-001)", value: "PER-001" },
        { label: "Mech Keyboard (PER-002)", value: "PER-002" },
        { label: "USB-C Hub (ACC-055)", value: "ACC-055" },
        { label: "Monitor 27in (DIS-101)", value: "DIS-101" },
    ];

    const locationOptions = [
        { label: "Warehouse A - Row 1", value: "A1" },
        { label: "Warehouse A - Row 2", value: "A2" },
        { label: "Store Front", value: "Store" },
        { label: "Receiving Dock", value: "Dock" },
    ];

    // Dummy data for Inventory Table
    const inventoryData = [
        { id: "001", name: "Wireless Mouse", sku: "PER-001", stock: "145" },
        { id: "002", name: "Mechanical Keyboard", sku: "PER-002", stock: "32" },
        { id: "003", name: "USB-C Hub", sku: "ACC-055", stock: "89" },
        { id: "004", name: "Monitor 27-inch", sku: "DIS-101", stock: "12" },
        { id: "005", name: "Laptop Stand", sku: "ACC-012", stock: "205" },
        { id: "006", name: "Webcam 1080p", sku: "PER-099", stock: "0" }, 
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
                <View className="flex-1 bg-black/50 justify-center px-4">
                    <View className="bg-gray-100 h-3/5 rounded-lg p-4 shadow-xl">
                        <View className="flex-1 gap-4">
                            
                            {/* Header */}
                            <Text className="text-xl font-bold text-gray-800">New Inventory Batch</Text>

                            {/* ROW 1: Item Select (Wide) & Quantity (Narrow) */}
                            <View className="flex-1 gap-4 flex-row">
                                <View className="flex-[2]">
                                    <Text className="text-black font-bold mb-1">Item / SKU</Text>
                                    <CustomPicker 
                                        selectedValue={selectedItem} 
                                        onValueChange={setSelectedItem} 
                                        placeholder="Select Item..." 
                                        items={itemOptions}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black font-bold mb-1">Quantity</Text>
                                    <TextInput 
                                        className="bg-white flex-1 rounded-md px-3" 
                                        placeholder="0" 
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* ROW 2: Batch # & Location */}
                            <View className="flex-1 gap-4 flex-row">
                                <View className="flex-1">
                                    <Text className="text-black font-bold mb-1">Batch ID</Text>
                                    <TextInput className="bg-white flex-1 rounded-md px-3" placeholder="#BATCH-001" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black font-bold mb-1">Location</Text>
                                    <CustomPicker 
                                        selectedValue={location} 
                                        onValueChange={setLocation} 
                                        placeholder="Select Loc..." 
                                        items={locationOptions}
                                    />
                                </View>
                            </View>

                            {/* ROW 3: Supplier / Notes */}
                            <View className="flex-[2]">
                                <Text className="text-black font-bold mb-1">Supplier / Notes</Text>
                                <TextInput 
                                    className="bg-white flex-1 rounded-md p-3 text-base" 
                                    multiline={true}
                                    textAlignVertical="top"
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Enter supplier details..."
                                />
                            </View>

                            {/* ROW 4: Buttons */}
                            <View className="flex-1 items-center">
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


            {/* 1. TOP VIEW: Search and Action Buttons */}
            <View className="flex-[1] flex-row items-center justify-between">
                {/* Search Bar */}
                <View className="w-[37.5%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
                    <Search size={20} color="gray" />
                    <TextInput 
                        placeholder="Search Inventory Batch" 
                        className="flex-1 ml-2 text-base text-gray-700"
                    />
                </View>

                {/* Right Side Buttons Group */}
                <View className="flex-row gap-2 h-full">
                    {/* Inventory Check Button */}
                    <Pressable 
                        className="px-4 h-full flex-row items-center justify-center bg-white rounded-md active:bg-gray-50" 
                        onPress={() => router.push('/inventoryDetailed')}
                    >
                        <ClipboardCheck size={20} color="#4b5563" />
                        <Text className="text-gray-700 font-medium ml-2">Inventory Check</Text>
                    </Pressable>

                    {/* New Item Button - Triggers Modal */}
                    <Pressable 
                        onPress={() => setModalVisible(true)}
                        className="px-4 h-full flex-row items-center justify-center bg-primary rounded-md active:bg-blue-700"
                    >
                        <Plus size={20} color="white" />
                        <Text className="text-white font-medium ml-2">New Inventory Batch</Text>
                    </Pressable>
                </View>
            </View>

            {/* 2. MIDDLE VIEW: Inventory Table */}
            <View className="flex-[12] bg-white rounded-lg overflow-hidden">
                {/* Table Header */}
                <View className="flex-row bg-gray-200 p-4 border-b border-gray-300">
                    <Text className="flex-1 font-bold text-gray-700">Item Name</Text>
                    <Text className="flex-1 font-bold text-gray-700">SKU</Text>
                    <Text className="flex-1 font-bold text-right text-gray-700">Stock Level</Text>
                </View>

                {/* Table Body */}
                <View className="flex-1">
                    {inventoryData.map((item, index) => (
                        <Pressable 
                            onPress={() => router.push('/editInventory')}
                            key={index} 
                            className="flex-1 flex-row items-center p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-50"
                        >
                            <View className="flex-1 flex-row items-center gap-2">
                                <Package size={16} color="gray" />
                                <Text className="text-gray-800 font-medium">{item.name}</Text>
                            </View>
                            <Text className="flex-1 text-gray-600">{item.sku}</Text>
                            <Text className={`flex-1 text-right font-bold ${item.stock === "0" ? "text-red-500" : "text-gray-800"}`}>
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

// --- STYLES ---
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