import { Picker } from '@react-native-picker/picker';
import { router } from "expo-router";
import React, { useState } from 'react';
// Added ScrollView to imports
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// --- REUSABLE COMPONENT (Shared with editInventory.tsx) ---
const CustomPicker = ({ selectedValue, onValueChange, placeholder, items, enabled = true }) => {
    const [isFocused, setIsFocused] = useState(false);

    const truncate = (str, n) => {
        return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
    };

    return (
        <View style={[
            styles.pickerContainer,
            isFocused && styles.pickerFocused,
            !enabled && styles.pickerDisabled
        ]}>
            <View style={styles.visualContainer}>
                <Text
                    style={[
                        styles.pickerText,
                        !selectedValue && styles.placeholderText,
                        !enabled && styles.textDisabled
                    ]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                >
                    {selectedValue
                        ? items.find(i => i.value === selectedValue)?.label || selectedValue
                        : placeholder
                    }
                </Text>
                {enabled && (
                    <View style={styles.arrowContainer}>
                        <View style={[
                            styles.roundedArrow,
                            isFocused && styles.arrowOpen
                        ]} />
                    </View>
                )}
            </View>
            <Picker
                selectedValue={selectedValue}
                onValueChange={(itemValue) => {
                    if (enabled) {
                        onValueChange(itemValue);
                        setIsFocused(false);
                    }
                }}
                onFocus={() => enabled && setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={styles.invisiblePicker}
                enabled={enabled}
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

export default function ScannedInventory() {
    // --- MOCK SCANNED DATA (Read-Only) ---
    const scannedData = {
        batchId: "BATCH-8829-X",
        material: "copper",
        netWeight: "450 kg",
        supplier: "MetalCorp Intl.",
        location: "Zone A - Rack 4",
    };

    // --- MOCK TRANSACTION HISTORY ---
    const transactionHistory = [
        { date: '2023-10-01', type: 'Inbound', qty: '+450', user: 'J. Doe' },
        { date: '2023-10-05', type: 'Move', qty: '-', user: 'M. Smith' },
        { date: '2023-10-12', type: 'Audit', qty: '0', user: 'SysAdmin' },
        { date: '2023-10-15', type: 'Sample', qty: '-5', user: 'QC_Team' },
    ];

    // --- EDITABLE STATE ---
    const [status, setStatus] = useState("verified");
    const [notes, setNotes] = useState("");

    const statusItems = [
        { label: "Verified / Good", value: "verified" },
        { label: "Damaged / Flagged", value: "damaged" },
        { label: "Wrong Location", value: "wrong_loc" },
    ];

    const materialItems = [{ label: "Copper", value: "copper" }];

    return (
        <View className="flex-1 px-4 justify-center bg-gray-100">
            {/* Increased height to h-5/6 to fit the table */}
            <View className="h-5/6 gap-4">
                
                {/* HEADER ROW: Title & Batch ID */}
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

                {/* ROW 2: Material | Weight | Status */}
                <View className="h-16 gap-4 flex-row">
                    <View className="flex-1">
                        <Text className="text-gray-600 font-bold mb-1">Material</Text>
                        <CustomPicker 
                            selectedValue={scannedData.material} 
                            items={materialItems}
                            enabled={false} 
                        />
                    </View>
                    
                    <View className="flex-1">
                        <Text className="text-gray-600 font-bold mb-1">Net Weight</Text>
                        <TextInput 
                            className="bg-gray-200 flex-1 rounded-md px-3 text-gray-500" 
                            value={scannedData.netWeight}
                            editable={false}
                        />
                    </View>

                    <View className="flex-1">
                        <Text className="text-black font-bold mb-1">Status Check</Text>
                        <CustomPicker 
                            selectedValue={status} 
                            onValueChange={setStatus} 
                            placeholder="Set Status..." 
                            items={statusItems}
                        />
                    </View>
                </View>

                {/* ROW 3: More Details & Notes */}
                <View className="h-36 gap-4 flex-row">
                    <View className="flex-[2] gap-4">
                        <View className="flex-1">
                            <Text className="text-gray-600 font-bold mb-1">Supplier / Origin</Text>
                            <TextInput 
                                className="bg-gray-200 flex-1 rounded-md px-3 text-gray-500" 
                                value={scannedData.supplier}
                                editable={false}
                            />
                        </View>
                        
                        <View className="flex-1">
                            <Text className="text-gray-600 font-bold mb-1">Current Location</Text>
                            <TextInput 
                                className="bg-gray-200 flex-1 rounded-md px-3 text-gray-500" 
                                value={scannedData.location}
                                editable={false}
                            />
                        </View>
                    </View>

                    <View className="flex-1">
                        <Text className="text-black font-bold mb-1">Scan Notes</Text>
                        <TextInput 
                            className="bg-white flex-1 rounded-md p-3 text-base border border-gray-200" 
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add remarks..."
                        />
                    </View>
                </View>

                {/* --- NEW SECTION: TRANSACTION LINE ITEMS TABLE --- */}
                <View className="flex-1 mt-2">
                    <Text className="text-gray-600 font-bold mb-1">Transaction Line Items</Text>
                    <View className="bg-white flex-1 rounded-md border border-gray-200 overflow-hidden">
                        {/* Table Header */}
                        <View className="flex-row bg-gray-100 p-2 border-b border-gray-300">
                            <Text className="flex-[2] font-bold text-xs text-gray-700">Date</Text>
                            <Text className="flex-[2] font-bold text-xs text-gray-700">Type</Text>
                            <Text className="flex-1 font-bold text-xs text-gray-700 text-right">Qty</Text>
                            <Text className="flex-[2] font-bold text-xs text-gray-700 text-right">User</Text>
                        </View>
                        
                        {/* Table Body */}
                        <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                            {transactionHistory.map((item, index) => (
                                <View key={index} className={`flex-row p-2 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <Text className="flex-[2] text-xs text-gray-600">{item.date}</Text>
                                    <Text className="flex-[2] text-xs text-gray-800 font-medium">{item.type}</Text>
                                    <Text className={`flex-1 text-xs text-right font-bold ${item.qty.startsWith('-') ? 'text-red-500' : 'text-green-600'}`}>
                                        {item.qty}
                                    </Text>
                                    <Text className="flex-[2] text-xs text-gray-500 text-right">{item.user}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* BUTTONS */}
                <View className="h-16 items-center mt-2">
                    <View className="w-1/2 h-full gap-4 flex-row">
                        <TouchableOpacity 
                            onPress={() => router.back()}
                            className="bg-gray-500 flex-1 justify-center items-center rounded-md h-3/4"
                        >
                            <Text className="font-semibold text-lg text-white">Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => router.push('/')}
                            className="bg-blue-600 flex-1 justify-center items-center rounded-md h-3/4"
                        >
                            <Text className="font-semibold text-lg text-white">Verify</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

// Styles reused from editInventory.tsx
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
    pickerDisabled: {
        backgroundColor: '#e5e7eb',
        borderColor: '#d1d5db',
        borderWidth: 1,
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
    textDisabled: {
        color: '#6b7280',
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