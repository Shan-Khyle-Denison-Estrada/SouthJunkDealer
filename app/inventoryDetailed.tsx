import { Picker } from '@react-native-picker/picker';
import { router } from "expo-router";
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function InventoryDetailed() {
    const [selectedBatch, setSelectedBatch] = useState();
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View className="flex-1 p-4 gap-4">
            {/* --- UPPER MOST INNER VIEW CONTAINER WITH BIG DROPDOWN --- */}
            {/* Removed left padding (pl-0) so the dropdown touches the left edge */}
            <View className="flex-1 justify-center px-4 rounded-md">
                
                {/* CUSTOM DROPDOWN IMPLEMENTATION */}
                <View style={[
                    styles.pickerContainer,
                    isFocused && styles.pickerFocused 
                ]}>
                    {/* Visual Layer */}
                    <View style={styles.visualContainer}>
                        <Text 
                            style={[
                                styles.pickerText, 
                                !selectedBatch && styles.placeholderText 
                            ]}
                            numberOfLines={1} 
                        >
                            {selectedBatch 
                                ? selectedBatch 
                                : "Select Batch ID..."
                            }
                        </Text>
                        
                        <View style={styles.arrowContainer}>
                            <View style={[
                                styles.roundedArrow,
                                isFocused && styles.arrowOpen 
                            ]} />
                        </View>
                    </View>

                    {/* Functional Layer */}
                    <Picker
                        selectedValue={selectedBatch}
                        onValueChange={(itemValue) => {
                            setSelectedBatch(itemValue);
                            setIsFocused(false);
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        style={styles.invisiblePicker}
                        mode="dropdown" 
                    >
                        <Picker.Item label="Select Batch ID..." value={null} enabled={false} />
                        <Picker.Item label="BALE-ID-01" value="BALE-ID-01" />
                        <Picker.Item label="BALE-ID-02" value="BALE-ID-02" />
                        <Picker.Item label="BALE-ID-03" value="BALE-ID-03" />
                        <Picker.Item label="BALE-ID-99" value="BALE-ID-99" />
                    </Picker>
                </View>
            </View>

            {/* --- DETAILS ROW --- */}
            <View className="flex-1 flex-row gap-4 px-4">
                <View className="flex-1 place-content-center items-center">
                    <Text className="font-semibold text-lg">
                        Batch ID
                    </Text>
                    <Text className="font-semibold text-3xl">
                        {selectedBatch || "---"}
                    </Text>
                </View>
                <View className="flex-1 place-content-center items-center">
                    <Text className="font-semibold text-lg">
                        Material
                    </Text>
                    <Text className="font-semibold text-3xl">
                        Copper
                    </Text>
                </View>
                <View className="flex-1 place-content-center items-center">
                    <Text className="font-semibold text-lg">
                        Net Weight
                    </Text>
                    <Text className="font-semibold text-3xl">
                        559 Kg
                    </Text>
                </View>
                <View className="flex-1 place-content-center items-center">
                    <Text className="font-semibold text-lg">
                        Status
                    </Text>
                    <Text className="font-semibold text-3xl">
                        Warehoused
                    </Text>
                </View>
            </View>

            {/* --- IMAGES SECTION --- */}
            <View className="flex-[5] gap-4 flex-row px-4">
                <View className="flex-[3] bg-white overflow-clip rounded-md p-4">
                    <Text className="text-gray-500">Inventory Batch Image Placeholder</Text>
                </View>
                <View className="flex-1 bg-white rounded-md p-4">
                    <Text className="text-gray-500">QR Code Image Placeholder</Text>
                </View>
            </View>

            {/* --- ACTION BUTTONS --- */}
            <View className="flex-1 flex-row gap-4 px-4">
                <TouchableOpacity className="bg-red-500 flex-1 justify-center items-center rounded-md">
                    <Text className="font-semibold text-2xl text-white">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-blue-500 flex-1 justify-center items-center rounded-md">
                    <Text className="font-semibold text-2xl text-white">Print QR</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-primary flex-1 justify-center items-center rounded-md" onPress={() => router.push('/editInventory')}>
                    <Text className="font-semibold text-2xl text-white">Add</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-green-500 flex-1 justify-center items-center rounded-md" onPress={() => router.push('/scannedInventory')}>
                    <Text className="font-semibold text-2xl text-white">Inventory Check</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    pickerContainer: {
        flex: 1, // CHANGED: Replaced fixed height with flex: 1 to fill vertical space
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
    pickerFocused: {
        borderColor: '#F2C94C', 
    },
    visualContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, 
        height: '100%',
        width: '100%',
    },
    pickerText: {
        fontSize: 24, 
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
        width: 12,
        height: 12,
        borderBottomWidth: 3, 
        borderRightWidth: 3,  
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
        height: '100%',
    }
});