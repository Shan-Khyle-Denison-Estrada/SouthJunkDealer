import { Picker } from '@react-native-picker/picker';
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react-native";
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
    const [capacity, setCapacity] = useState("");

    // Dummy Data for Form Dropdowns
    const itemOptions = [
        { label: "Copper Wire", value: "copper" },
        { label: "Aluminum Cans", value: "aluminum" },
        { label: "PET Bottles", value: "pet" },
        { label: "Steel Scraps", value: "steel" },
    ];

    // UPDATED Dummy Data for Table (Added Date)
    const inventoryData = [
        { batchId: "BATCH-8829-X", material: "Copper Wire", weight: "450.0 kg", date: "2023-10-27", status: "In Stock" },
        { batchId: "BATCH-9021-A", material: "Aluminum Cans", weight: "120.5 kg", date: "2023-10-26", status: "Processing" },
        { batchId: "BATCH-7712-C", material: "PET Bottles", weight: "890.0 kg", date: "2023-10-25", status: "In Stock" },
        { batchId: "BATCH-3321-B", material: "Steel Scraps", weight: "2,100 kg", date: "2023-10-24", status: "Shipped" },
        { batchId: "BATCH-1102-D", material: "Cardboard", weight: "350.0 kg", date: "2023-10-23", status: "In Stock" },
        { batchId: "BATCH-5543-F", material: "Glass Bottles", weight: "500.0 kg", date: "2023-10-22", status: "Processing" },
    ];

    // Helper for Status Color
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'in stock': return 'text-green-600';
            case 'processing': return 'text-blue-600';
            case 'shipped': return 'text-gray-500';
            default: return 'text-gray-800';
        }
    };

    return (
        <View className="flex-1 bg-gray-100 p-4 gap-4">

            {/* --- MODAL FORM (Updated to match Materials Page) --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <Text className="text-xl font-bold text-gray-800">New Inventory Batch</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {/* Fields: Material Category & Total Capacity */}
                        <View className="gap-4">
                            <View>
                                <Text className="text-gray-700 font-bold mb-1">Material Category</Text>
                                <View className="h-12">
                                    <CustomPicker 
                                        selectedValue={selectedItem} 
                                        onValueChange={setSelectedItem} 
                                        placeholder="Select Material..." 
                                        items={itemOptions}
                                    />
                                </View>
                            </View>
                            
                            <View>
                                <Text className="text-gray-700 font-bold mb-1">Total Capacity</Text>
                                <TextInput 
                                    className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300" 
                                    placeholder="0.00" 
                                    keyboardType="numeric"
                                    value={capacity}
                                    onChangeText={setCapacity}
                                />
                            </View>
                        </View>

                        {/* Buttons */}
                        <View className="mt-6 flex-row gap-3">
                            <TouchableOpacity 
                                onPress={() => setModalVisible(false)} 
                                className="flex-1 bg-red-600 p-3 rounded-md items-center"
                            >
                                <Text className="font-bold text-white">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setModalVisible(false)} 
                                className="flex-1 bg-green-600 p-3 rounded-md items-center"
                            >
                                <Text className="font-bold text-white">Save</Text>
                            </TouchableOpacity>
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
                    <Pressable 
                        onPress={() => setModalVisible(true)}
                        className="px-4 h-full flex-row items-center justify-center bg-primary rounded-md active:bg-blue-700"
                    >
                        <Plus size={24} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">New Inventory Batch</Text>
                    </Pressable>
                </View>
            </View>

            {/* 2. MIDDLE VIEW: Inventory Table (Static View, Consistent Design) */}
            <View className="flex-[12] bg-white rounded-lg overflow-hidden border border-gray-200">
                {/* Table Header - Added Date */}
                <View className="flex-row bg-gray-800 p-4">
                    <Text className="flex-1 font-bold text-white text-center text-lg">Batch ID</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Material</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Net Weight</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Date</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Status</Text>
                </View>

                {/* Table Body (Not Scrollable) */}
                <View className="flex-1">
                    {inventoryData.map((item, index) => (
                        <Pressable 
                            onPress={() => router.push('/inventoryDetailed')}
                            key={index} 
                            className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} active:bg-blue-50`}
                        >
                            <Text className="flex-1 text-gray-800 text-center text-lg font-medium">{item.batchId}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.material}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.weight}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.date}</Text>
                            <Text className={`flex-1 text-center text-lg font-bold ${getStatusColor(item.status)}`}>
                                {item.status}
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
    },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20 
    },
    modalContent: { 
        backgroundColor: 'white', 
        width: '50%', 
        borderRadius: 12, 
        padding: 24, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 4, 
        elevation: 5 
    }
});