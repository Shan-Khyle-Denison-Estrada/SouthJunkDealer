import { Picker } from '@react-native-picker/picker';
import { Trash2, X } from "lucide-react-native";
import React, { useState } from 'react';
import {
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

// --- REUSABLE COMPONENT (Unchanged) ---
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
                onValueChange={(itemValue) => { onValueChange(itemValue); setIsFocused(false); }}
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

export default function EditInventory() {
    // --- STATE MANAGEMENT ---
    // Form States
    const [batchId, setBatchId] = useState("");
    const [material, setMaterial] = useState();
    const [weight, setWeight] = useState("");
    const [notes, setNotes] = useState("");

    // List State (Updated structure for Total vs Included)
    const [pendingItems, setPendingItems] = useState([
        { 
            id: 1, 
            batchId: "BATCH-001", 
            material: "Copper", 
            totalWeight: "120 kg", 
            includedWeight: "120 kg", 
            notes: "First load" 
        },
        { 
            id: 2, 
            batchId: "BATCH-002", 
            material: "Steel", 
            totalWeight: "500 kg", 
            includedWeight: "250 kg", // Example: Partial weight included
            notes: "-" 
        },
    ]);

    // Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [modalWeight, setModalWeight] = useState("");

    // --- HANDLERS ---
    const handleAddItem = () => {
        if (!batchId || !material || !weight) return;
        
        const newItem = {
            id: Date.now(),
            batchId,
            material: materialItems.find(m => m.value === material)?.label,
            totalWeight: `${weight} kg`,    // Sets original total
            includedWeight: `${weight} kg`, // Defaults included to 100%
            notes: notes || "-"
        };

        setPendingItems([...pendingItems, newItem]);
        setBatchId("");
        setMaterial(null);
        setWeight("");
        setNotes("");
    };

    const handleDeleteItem = (id) => {
        setPendingItems(pendingItems.filter(item => item.id !== id));
    };

    // --- MODAL HANDLERS ---
    const handleRowClick = (item) => {
        setSelectedRow(item);
        // Strip " kg" for the numeric input
        const numericWeight = item.includedWeight.replace(' kg', '');
        setModalWeight(numericWeight);
        setIsModalVisible(true);
    };

    const handleSaveModalWeight = () => {
        if (selectedRow && modalWeight) {
            setPendingItems(prevItems => prevItems.map(item => 
                item.id === selectedRow.id 
                    ? { ...item, includedWeight: `${modalWeight} kg` } 
                    : item
            ));
            setIsModalVisible(false);
            setSelectedRow(null);
        }
    };

    // --- MOCK DATA ---
    const materialItems = [
        { label: "Copper", value: "copper" },
        { label: "Aluminum", value: "aluminum" },
        { label: "Steel", value: "steel" },
        { label: "High Grade Heavy Industrial Steel", value: "heavy_steel" },
    ];

    return (
        <View className="flex-1 px-4 py-4 justify-start gap-6 bg-gray-50">
            
            {/* --- SECTION 1: ADD ITEM FORM --- */}
            <View className="h-[40%] gap-4 p-4 bg-white rounded-md">
                <Text className="text-lg font-bold text-gray-800">Inventory Batch Details</Text>
                
                <View className="flex-[1.5] gap-4 flex-row">
                    <View className="flex-1">
                        <Text className="text-gray-700 font-bold mb-1">Inventory Batch ID</Text>
                        <TextInput 
                            className="bg-gray-100 flex-1 rounded-md px-3 border border-gray-200" 
                            value={batchId}
                            onChangeText={setBatchId}
                            placeholder="Scan or Enter ID"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-700 font-bold mb-1">Material</Text>
                        <CustomPicker 
                            selectedValue={material} 
                            onValueChange={setMaterial} 
                            placeholder="Select Type..." 
                            items={materialItems}
                        />
                    </View>
                </View>

                <View className="flex-[1.5] gap-4 flex-row">
                    <View className="flex-1">
                        <Text className="text-gray-700 font-bold mb-1">Net Weight (kg)</Text>
                        <TextInput 
                            className="bg-gray-100 flex-1 rounded-md px-3 border border-gray-200" 
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="0.00"
                        />
                    </View>
                    <View className="flex-[2]">
                        <Text className="text-gray-700 font-bold mb-1">Notes</Text>
                        <TextInput 
                            className="bg-gray-100 flex-1 rounded-md p-3 text-base border border-gray-200" 
                            multiline={true}
                            numberOfLines={2}
                            textAlignVertical="top"
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Optional remarks..."
                        />
                    </View>
                </View>
            </View>

            {/* --- SECTION 2: ITEMS TABLE (Updated Columns) --- */}
            <View className="flex-1 bg-white rounded-md overflow-hidden">
                <View className="flex-row bg-gray-200 p-3 border-b border-gray-300">
                    <Text className="flex-[2] font-bold text-gray-700 text-xs">Batch ID</Text>
                    <Text className="flex-[2] font-bold text-gray-700 text-xs">Material</Text>
                    {/* Split Headers */}
                    <Text className="flex-[1.5] font-bold text-right text-gray-500 text-xs">Total</Text>
                    <Text className="flex-[1.5] font-bold text-right text-gray-700 text-xs">Included</Text>
                    
                    <Text className="flex-[2] font-bold text-gray-700 text-xs pl-4">Notes</Text>
                    <View className="w-8" /> 
                </View>

                <ScrollView className="flex-1">
                    {pendingItems.length === 0 ? (
                        <View className="p-8 items-center">
                            <Text className="text-gray-400 italic">No items added yet.</Text>
                        </View>
                    ) : (
                        pendingItems.map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                onPress={() => handleRowClick(item)} 
                                className="flex-row items-center p-3 border-b border-gray-100 active:bg-blue-50"
                            >
                                <Text className="flex-[2] text-gray-800 font-medium text-xs">{item.batchId}</Text>
                                <Text className="flex-[2] text-gray-600 text-xs">{item.material}</Text>
                                
                                {/* Total Weight (Static/Reference) */}
                                <Text className="flex-[1.5] text-gray-400 text-right text-xs decoration-dashed">
                                    {item.totalWeight}
                                </Text>
                                
                                {/* Included Weight (Active/Bold) */}
                                <Text className="flex-[1.5] text-blue-700 font-bold text-right text-xs">
                                    {item.includedWeight}
                                </Text>

                                <Text className="flex-[2] text-gray-500 text-xs pl-4" numberOfLines={1}>{item.notes}</Text>
                                
                                <TouchableOpacity 
                                    onPress={(e) => {
                                        e.stopPropagation(); 
                                        handleDeleteItem(item.id);
                                    }}
                                    className="w-8 items-center justify-center"
                                >
                                    <Trash2 size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* --- SECTION 3: ACTIONS --- */}
            <View className="h-16 flex-row gap-4 mb-2">
                 <TouchableOpacity className="bg-red-600 flex-1 justify-center items-center rounded-md">
                    <Text className="font-semibold text-xl text-white">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-green-600 flex-1 justify-center items-center rounded-md">
                    <Text className="font-semibold text-xl text-white">Submit</Text>
                </TouchableOpacity>
            </View>

            {/* --- MODAL IMPLEMENTATION --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.modalContent}
                    >
                        {/* Modal Header */}
                        <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <Text className="text-lg font-bold text-gray-800">
                                Allocate Weight
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <Text className="text-gray-500 mb-2">
                            Adjust included weight for <Text className="font-bold text-black">{selectedRow?.batchId}</Text>.
                        </Text>
                        
                        {/* Reference for Total Weight */}
                        <Text className="text-gray-400 text-sm mb-4">
                            Max Available: <Text className="font-semibold text-gray-600">{selectedRow?.totalWeight}</Text>
                        </Text>

                        <View className="mb-6">
                            <Text className="text-gray-700 font-bold mb-1">Included Weight (kg)</Text>
                            <TextInput 
                                className="bg-gray-100 rounded-md p-3 text-lg border border-gray-300 text-center font-bold text-blue-600" 
                                keyboardType="numeric"
                                value={modalWeight}
                                onChangeText={setModalWeight}
                                autoFocus={true}
                                selectTextOnFocus={true}
                            />
                        </View>

                        {/* Modal Actions */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity 
                                onPress={() => setIsModalVisible(false)}
                                className="flex-1 bg-gray-200 p-3 rounded-md items-center"
                            >
                                <Text className="font-bold text-gray-700">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleSaveModalWeight}
                                className="flex-1 bg-blue-600 p-3 rounded-md items-center"
                            >
                                <Text className="font-bold text-white">Update</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

        </View>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    pickerContainer: {
        flex: 1,
        backgroundColor: '#f3f4f6', 
        borderRadius: 6,
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    pickerFocused: {
        borderColor: '#F2C94C',
        backgroundColor: 'white',
        borderWidth: 2,
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
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        width: '100%',
        maxWidth: 400,
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    }
});