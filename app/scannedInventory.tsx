import { Picker } from '@react-native-picker/picker';
import { router } from "expo-router";
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// --- REUSABLE COMPONENT ---
const CustomPicker = ({ selectedValue, onValueChange, placeholder, items, enabled = true }) => {
    const [isFocused, setIsFocused] = useState(false);
    const truncate = (str, n) => (str.length > n) ? str.substr(0, n - 1) + '...' : str;

    return (
        <View style={[styles.pickerContainer, isFocused && styles.pickerFocused, !enabled && styles.pickerDisabled]}>
            <View style={styles.visualContainer}>
                <Text style={[styles.pickerText, !selectedValue && styles.placeholderText, !enabled && styles.textDisabled]} numberOfLines={1}>
                    {selectedValue ? items.find(i => i.value === selectedValue)?.label || selectedValue : placeholder}
                </Text>
                {enabled && (
                    <View style={styles.arrowContainer}>
                        <View style={[styles.roundedArrow, isFocused && styles.arrowOpen]} />
                    </View>
                )}
            </View>
            <Picker
                selectedValue={selectedValue}
                onValueChange={(v) => { if (enabled) { onValueChange(v); setIsFocused(false); } }}
                onFocus={() => enabled && setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={styles.invisiblePicker}
                enabled={enabled}
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

export default function ScannedInventory() {
    const scannedData = {
        batchId: "BATCH-8829-X",
        material: "copper",
        netWeight: "450 kg",
        supplier: "MetalCorp Intl.",
        location: "Zone A - Rack 4",
    };

    const lineItems = Array(15).fill({ id: "L-101", material: "Copper", totalW: "15.0 kg", inclW: "14.5 kg", price: "₱12.00", subtotal: "₱180.00" });

    const [status, setStatus] = useState("verified");
    const [notes, setNotes] = useState("");
    const [isModalVisible, setModalVisible] = useState(false);
    const [adjWeight, setAdjWeight] = useState("");

    // --- HANDLERS ---
    const handleSubmit = () => {
        // if (status === "verified") {
        //     router.push('/auditTrails');
        // } else {
        //     setModalVisible(true);
        // }
        setModalVisible(true);

    };

    const handleConfirmModal = () => {
        setModalVisible(false);
        router.push('/auditTrails');
    };

    return (
        <View className="flex-1 px-4 bg-gray-100">
            <View className="flex-1 gap-4 py-4">
                
                {/* HEADER ROW */}
                <View className="items-center justify-center">
                   <Text className="text-gray-500 font-bold mb-2 uppercase tracking-widest">Scanned Item Details</Text>
                    <View className="w-[50%] h-12">
                        <TextInput 
                            className="bg-gray-200 flex-1 rounded-md px-3 text-center font-bold text-gray-600 border border-gray-300" 
                            value={scannedData.batchId}
                            editable={false}
                        />
                    </View>
                </View>

                {/* ROW 2: Info Pickers */}
                <View className="h-16 gap-4 flex-row">
                    <View className="flex-1"><Text className="text-gray-600 font-bold mb-1">Material</Text><CustomPicker selectedValue={scannedData.material} items={[{label: "Copper", value: "copper"}]} enabled={false} /></View>
                    <View className="flex-1"><Text className="text-gray-600 font-bold mb-1">Net Weight</Text><TextInput className="bg-gray-200 flex-1 rounded-md px-3 text-gray-500" value={scannedData.netWeight} editable={false}/></View>
                    <View className="flex-1">
                        <Text className="text-black font-bold mb-1">Status Check</Text>
                        <CustomPicker 
                            selectedValue={status} 
                            onValueChange={setStatus} 
                            items={[
                                {label: "Verified", value: "verified"}, 
                                {label: "Damaged", value: "damaged"}, 
                                {label: "Adjust", value: "adjust"}
                            ]} 
                        />
                    </View>
                </View>

                {/* ROW 3: Origin & Notes */}
                <View className="h-36 gap-4 flex-row">
                    <View className="flex-[2] gap-4">
                        <View className="flex-1"><Text className="text-gray-600 font-bold mb-1">Supplier</Text><TextInput className="bg-gray-200 flex-1 rounded-md px-3 text-gray-500" value={scannedData.supplier} editable={false}/></View>
                        <View className="flex-1"><Text className="text-gray-600 font-bold mb-1">Location</Text><TextInput className="bg-gray-200 flex-1 rounded-md px-3 text-gray-500" value={scannedData.location} editable={false}/></View>
                    </View>
                    <View className="flex-1">
                        <Text className="text-black font-bold mb-1">Scan Notes</Text>
                        <TextInput className="bg-white flex-1 rounded-md p-3 border border-gray-200" multiline textAlignVertical="top" value={notes} onChangeText={setNotes} placeholder="Add remarks..." />
                    </View>
                </View>

                {/* TABLE SECTION */}
                <View className="flex-1 mt-2">
                    <Text className="text-gray-600 font-bold mb-1">Transaction Line Items</Text>
                    <View className="bg-white flex-1 rounded-md border border-gray-200 overflow-hidden">
                        <View className="flex-row bg-gray-800 p-3">
                            {["ID", "Material", "Total Weight", "Included Weight", "Price/Unit", "Subtotal"].map((h, i) => (
                                <Text key={i} className="flex-1 font-bold text-white text-center text-[10px]">{h}</Text>
                            ))}
                        </View>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                            {lineItems.map((item, index) => (
                                <View key={index} className={`flex-row items-center p-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <Text className="flex-1 text-gray-800 text-center text-[10px] font-medium">{item.id}</Text>
                                    <Text className="flex-1 text-gray-600 text-center text-[10px]">{item.material}</Text>
                                    <Text className="flex-1 text-gray-600 text-center text-[10px]">{item.totalW}</Text>
                                    <Text className="flex-1 text-gray-600 text-center text-[10px]">{item.inclW}</Text>
                                    <Text className="flex-1 text-gray-600 text-center text-[10px]">{item.price}</Text>
                                    <Text className="flex-1 text-blue-700 text-center text-[10px] font-bold">{item.subtotal}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <View className="h-10 bg-gray-200 flex-row justify-center items-center gap-2">
                            <Text className="font-semibold text-gray-700 text-xs">Total Amount:</Text>
                            <Text className="font-bold text-sm text-black">₱7,429.00</Text>
                        </View>
                    </View>
                </View>

                {/* BOTTOM BUTTONS */}
                <View className="h-16 flex-row gap-4">
                    <TouchableOpacity onPress={() => router.back()} className="bg-gray-500 flex-1 justify-center items-center rounded-md"><Text className="font-semibold text-lg text-white">Back</Text></TouchableOpacity>
                    <TouchableOpacity onPress={handleSubmit} className="bg-primary flex-1 justify-center items-center rounded-md"><Text className="font-semibold text-lg text-white">Submit</Text></TouchableOpacity>
                </View>
            </View>

            {/* --- ACTION MODAL --- */}
            <Modal transparent visible={isModalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View className="bg-white w-4/5 p-6 rounded-lg shadow-xl border border-gray-200">
                        <Text className="text-xl font-bold mb-4 text-center">
                            {status === "damaged" ? "Report Damage" : status === "verified" ? "Verify Inventory" : "Adjust Inventory"}
                        </Text>
                        
                        {status === "adjust" && (
                            <View className="mb-4">
                                <Text className="text-gray-600 font-bold mb-1">Adjusted Weight (kg)</Text>
                                <TextInput 
                                    className="border border-gray-300 rounded-md p-3 text-lg" 
                                    placeholder="Enter new weight..."
                                    keyboardType="numeric"
                                    value={adjWeight}
                                    onChangeText={setAdjWeight}
                                />
                            </View>
                        )}

                        <TouchableOpacity className="bg-gray-200 h-32 rounded-md justify-center items-center mb-6 border-dashed border-2 border-gray-400">
                            <Text className="text-gray-500 font-semibold">📸 Take Photo of {status === "damaged" ? "Damaged Inventory Batch" : status === "verified" ? "Verified Inventory Batch" : "Adjusted Inventory Batch"}</Text>
                        </TouchableOpacity>

                        <View className="flex-row gap-4">
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 bg-gray-400 p-4 rounded-md"><Text className="text-white text-center font-bold">Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirmModal} className="flex-1 bg-primary p-4 rounded-md"><Text className="text-white text-center font-bold">Confirm</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    pickerContainer: { flex: 1, backgroundColor: 'white', borderRadius: 6, justifyContent: 'center', position: 'relative', overflow: 'hidden', width: '100%', borderWidth: 2, borderColor: 'transparent' },
    pickerDisabled: { backgroundColor: '#e5e7eb', borderColor: '#d1d5db', borderWidth: 1 },
    pickerFocused: { borderColor: '#F2C94C' },
    visualContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: '100%', width: '100%' },
    pickerText: { fontSize: 16, color: 'black', flex: 1, marginRight: 10 },
    textDisabled: { color: '#6b7280' },
    placeholderText: { color: '#9ca3af' },
    arrowContainer: { justifyContent: 'center', alignItems: 'center', width: 20, height: 20 },
    roundedArrow: { width: 10, height: 10, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'black', transform: [{ rotate: '45deg' }], marginTop: -4, borderRadius: 2 },
    arrowOpen: { transform: [{ rotate: '225deg' }], marginTop: 4 },
    invisiblePicker: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, width: '100%', height: '100%' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});