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

    // List State
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
            includedWeight: "250 kg", 
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
            totalWeight: `${weight} kg`,
            includedWeight: `${weight} kg`, 
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
        <View className="flex-1 px-4 py-4 justify-start gap-4 bg-gray-50">
            
            {/* --- SECTION 1: ADD ITEM FORM (Refactored Layout) --- */}
            <View className="bg-white rounded-md p-4 shadow-sm border border-gray-200">
                <Text className="text-lg font-bold text-gray-800 mb-3">Inventory Batch Details</Text>
                
                {/* Row 1: Batch ID, Material, Weight (All in one row) */}
                <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                        <Text className="text-gray-700 font-bold mb-1 text-xs">Batch ID</Text>
                        <TextInput 
                            className="bg-gray-100 rounded-md px-3 h-12 border border-gray-200 text-sm" 
                            value={batchId}
                            onChangeText={setBatchId}
                            placeholder="ID"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-700 font-bold mb-1 text-xs">Material</Text>
                        <View className="h-12">
                            <CustomPicker 
                                selectedValue={material} 
                                onValueChange={setMaterial} 
                                placeholder="Select..." 
                                items={materialItems}
                            />
                        </View>
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-700 font-bold mb-1 text-xs">Net Weight</Text>
                        <TextInput 
                            className="bg-gray-100 rounded-md px-3 h-12 border border-gray-200 text-sm" 
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="0.00"
                        />
                    </View>
                </View>

                {/* Row 2: Notes (Full width, Taller) */}
                <View>
                    <Text className="text-gray-700 font-bold mb-1 text-xs">Notes</Text>
                    <TextInput 
                        className="bg-gray-100 rounded-md p-3 h-24 text-sm border border-gray-200" 
                        multiline={true}
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Optional remarks..."
                    />
                </View>                
           </View>

            {/* --- SECTION 2: ITEMS TABLE (Mimics scannedInventory style) --- */}
            <View className="flex-1 bg-white rounded-md border border-gray-200 overflow-hidden">
                {/* Header - Dark Theme */}
                <View className="flex-row bg-gray-800 p-3">
                    <Text className="flex-1 font-bold text-white text-center text-xs">Line Item ID</Text>
                    <Text className="flex-1 font-bold text-white text-center text-xs">Material</Text>
                    <Text className="flex-1 font-bold text-white text-center text-xs">Total Weight</Text>
                    <Text className="flex-1 font-bold text-white text-center text-xs">Included Weight</Text>
                    <View className="w-8" /> 
                </View>

                <ScrollView className="flex-1">
                    {pendingItems.length === 0 ? (
                        <View className="p-8 items-center">
                            <Text className="text-gray-400 italic">No items added yet.</Text>
                        </View>
                    ) : (
                        pendingItems.map((item, index) => (
                            <TouchableOpacity 
                                key={item.id} 
                                onPress={() => handleRowClick(item)} 
                                className={`flex-row items-center p-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} active:bg-blue-50`}
                            >
                                <Text className="flex-1 text-gray-800 text-center text-xs font-medium">{item.batchId}</Text>
                                <Text className="flex-1 text-gray-600 text-center text-xs">{item.material}</Text>
                                
                                <Text className="flex-1 text-gray-600 text-center text-xs">
                                    {item.totalWeight}
                                </Text>
                                
                                <Text className="flex-1 text-blue-700 font-bold text-center text-xs">
                                    {item.includedWeight}
                                </Text>
                                
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

            {/* --- MODAL IMPLEMENTATION (Unchanged Logic) --- */}
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
                        <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <Text className="text-lg font-bold text-gray-800">
                                Allocate Weight
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-500 mb-2">
                            Adjust included weight for <Text className="font-bold text-black">{selectedRow?.batchId}</Text>.
                        </Text>
                        
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
        fontSize: 14, // Adjusted for smaller height
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