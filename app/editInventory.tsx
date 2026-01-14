import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// --- REUSABLE COMPONENT BASED ON NEWTRANSACTION.TSX ---
const CustomPicker = ({ selectedValue, onValueChange, placeholder, items }) => {
    const [isFocused, setIsFocused] = useState(false);

    // HELPER: Truncates long text (from reference)
    const truncate = (str, n) => {
        return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
    };

    return (
        <View style={[
            styles.pickerContainer,
            isFocused && styles.pickerFocused
        ]}>
            {/* 1. VISUAL LAYER */}
            <View style={styles.visualContainer}>
                <Text
                    style={[
                        styles.pickerText,
                        !selectedValue && styles.placeholderText
                    ]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                >
                    {selectedValue
                        ? items.find(i => i.value === selectedValue)?.label || selectedValue
                        : placeholder
                    }
                </Text>

                {/* Custom Rounded Chevron Arrow */}
                <View style={styles.arrowContainer}>
                    <View style={[
                        styles.roundedArrow,
                        isFocused && styles.arrowOpen
                    ]} />
                </View>
            </View>

            {/* 2. FUNCTIONAL LAYER */}
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

export default function EditInventory() {
    // --- STATE MANAGEMENT ---
    const [material, setMaterial] = useState();
    const [status, setStatus] = useState();
    const [action, setAction] = useState();
    const [reason, setReason] = useState();
    const [notes, setNotes] = useState("");

    // --- MOCK DATA FOR DROPDOWNS ---
    const materialItems = [
        { label: "Copper", value: "copper" },
        { label: "Aluminum", value: "aluminum" },
        { label: "Steel", value: "steel" },
        { label: "High Grade Heavy Industrial Steel", value: "heavy_steel" },
    ];

    const statusItems = [
        { label: "In Stock", value: "in_stock" },
        { label: "Sold", value: "sold" },
        { label: "Reserved", value: "reserved" },
    ];

    const actionItems = [
        { label: "Update Record", value: "update" },
        { label: "Delete Record", value: "delete" },
        { label: "Flag for Review", value: "flag" },
    ];

    const reasonItems = [
        { label: "Correction", value: "correction" },
        { label: "Damaged Goods", value: "damaged" },
        { label: "Entry Error", value: "error" },
    ];

    return (
        <View className="flex-1 px-4 justify-center">
            <View className="h-3/5 gap-4">
                {/* TOP ROW */}
                <View className="flex-1 items-center">
                    <View className="w-[calc(33.33vw-20px)] h-full">
                        <Text className="text-black font-bold mb-1">Batch ID</Text>
                        <TextInput className="bg-white flex-1 rounded-md px-3" />
                    </View>
                </View>

                {/* SECOND ROW (3 Columns) */}
                <View className="flex-1 gap-4 flex-row">
                    {/* MATERIAL (Dropdown) */}
                    <View className="flex-1">
                        <Text className="text-black font-bold mb-1">Material</Text>
                        <CustomPicker 
                            selectedValue={material} 
                            onValueChange={setMaterial} 
                            placeholder="Select Material..." 
                            items={materialItems}
                        />
                    </View>
                    
                    <View className="flex-1">
                        <Text className="text-black font-bold mb-1">Net Weight</Text>
                        <TextInput 
                            className="bg-white flex-1 rounded-md px-3" 
                            keyboardType="numeric"
                        />
                    </View>

                    {/* STATUS (Dropdown) */}
                    <View className="flex-1">
                        <Text className="text-black font-bold mb-1">Status</Text>
                        <CustomPicker 
                            selectedValue={status} 
                            onValueChange={setStatus} 
                            placeholder="Select Status..." 
                            items={statusItems}
                        />
                    </View>
                </View>

                {/* THIRD ROW (Complex Layout) */}
                <View className="flex-[2] gap-4 flex-row">
                    <View className="flex-[2] gap-4">
                        <View className="flex-1 gap-4 flex-row">
                            {/* ACTION (Dropdown) */}
                            <View className="flex-1">
                                <Text className="text-black font-bold mb-1">Action</Text>
                                <CustomPicker 
                                    selectedValue={action} 
                                    onValueChange={setAction} 
                                    placeholder="Select Action..." 
                                    items={actionItems}
                                />
                            </View>
                            
                            {/* REASON (Dropdown) */}
                            <View className="flex-1">
                                <Text className="text-black font-bold mb-1">Reason</Text>
                                <CustomPicker 
                                    selectedValue={reason} 
                                    onValueChange={setReason} 
                                    placeholder="Select Reason..." 
                                    items={reasonItems}
                                />
                            </View>
                        </View>
                        <View className="flex-1">
                            <Text className="text-black font-bold mb-1">Photo</Text>
                            <TextInput className="bg-white flex-1 rounded-md px-3" placeholder="Photo URL or Path" />
                        </View>
                    </View>

                    {/* NOTES (Paragraph Form) */}
                    <View className="flex-1">
                        <Text className="text-black font-bold mb-1">Notes</Text>
                        <TextInput 
                            className="bg-white flex-1 rounded-md p-3 text-base" 
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top" // Ensures text starts at top-left
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>
                </View>

                {/* BUTTONS */}
                <View className="flex-1 items-center">
                    <View className="w-1/3 h-full gap-4 flex-row">
                        <TouchableOpacity className="bg-red-600 flex-1 place-content-center items-center rounded-md h-3/4">
                            <Text className="font-semibold text-2xl text-white">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-green-500 flex-1 place-content-center items-center rounded-md h-3/4">
                            <Text className="font-semibold text-2xl text-white">Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

// Styles copied and adapted from newTransaction.tsx
const styles = StyleSheet.create({
    pickerContainer: {
        flex: 1, // Changed from fixed height to flex to fit the grid layout
        backgroundColor: 'white',
        borderRadius: 6,
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        // Transparent border prevents layout jump
        borderWidth: 2,
        borderColor: 'transparent',
    },
    // Style applied when Picker is clicked/focused
    pickerFocused: {
        borderColor: '#F2C94C',
    },
    visualContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12, // Slightly reduced padding for tighter spots
        height: '100%',
        width: '100%',
    },
    pickerText: {
        fontSize: 16, // Adjusted font size for inventory form
        color: 'black',
        flex: 1,
        marginRight: 10,
    },
    placeholderText: {
        color: '#9ca3af',
    },
    // --- ARROW STYLES ---
    arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 20,
        height: 20,
    },
    roundedArrow: {
        width: 10, // Slightly smaller arrow
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
    // --- INVISIBLE PICKER ---
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