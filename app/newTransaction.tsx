import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function NewTransaction() {
    const [selectedMaterial, setSelectedMaterial] = useState();
    const [isFocused, setIsFocused] = useState(false);

    // HELPER: Truncates long text so the Android Dropdown doesn't overflow the screen
    const truncate = (str, n) => {
        return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
    };

    return (
        <View className="flex-1 p-4">
            <View className="flex-1 flex-col gap-4">
                <View className="flex-[3] gap-4 px-40">
                    <Text className="font-bold w-full text-center text-4xl">New Transaction Line Item</Text>
                    
                    {/* --- MATERIAL PICKER SECTION --- */}
                    <View className="flex-1 justify-center">
                        <Text className="text-lg font-semibold mb-2 ml-1">
                            Material
                        </Text>
                        
                        {/* CUSTOM PICKER CONTAINER */}
                        <View style={[
                            styles.pickerContainer,
                            // Apply custom color highlight when focused
                            isFocused && styles.pickerFocused 
                        ]}>
                            
                            {/* 1. VISUAL LAYER */}
                            <View style={styles.visualContainer}>
                                <Text 
                                    style={[
                                        styles.pickerText, 
                                        !selectedMaterial && styles.placeholderText 
                                    ]}
                                    numberOfLines={1} 
                                    ellipsizeMode='tail'
                                >
                                    {selectedMaterial 
                                        ? selectedMaterial.charAt(0).toUpperCase() + selectedMaterial.slice(1) 
                                        : "Select Material..."
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
                                selectedValue={selectedMaterial}
                                onValueChange={(itemValue) => {
                                    setSelectedMaterial(itemValue);
                                    setIsFocused(false);
                                }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                style={styles.invisiblePicker}
                                mode="dropdown" 
                            >
                                <Picker.Item label="Select Material..." value={null} enabled={false} />
                                <Picker.Item label="Copper" value="copper" />
                                <Picker.Item label="Aluminum" value="aluminum" />
                                <Picker.Item label="Steel" value="steel" />
                                <Picker.Item 
                                    label={truncate("High Grade Heavy Industrial Steel", 25)} 
                                    value="heavy_steel" 
                                />
                            </Picker>

                        </View>
                    </View>

                    {/* --- PRICE INPUT --- */}
                    <View className="flex-1 justify-center">
                        <Text className="text-lg font-semibold mb-2 ml-1">
                            Material Price
                        </Text>
                        <TextInput 
                            className="bg-white rounded-md px-4 mb-4 text-black text-2xl h-16"
                            placeholder="0.00"
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* --- WEIGHT INPUT --- */}
                    <View className="flex-1 justify-center">
                        <Text className="text-lg font-semibold mb-2 ml-1">
                            Weight
                        </Text>
                        <TextInput 
                            className="bg-white rounded-md px-4 mb-4 text-black text-2xl h-16"
                            placeholder="0.00"
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                        />
                    </View>
                </View>
                
                <View style={styles.separator} />
                
                <View className="flex-1 flex-row gap-4">
                    <View className="flex-[2] flex-row justify-center items-center gap-4">
                        <Text className="text-4xl font-semibold">Subtotal:</Text>
                        <Text className="text-6xl font-bold">69,000 Php</Text>
                    </View>
                    <View className="flex-1 justify-center">
                        <Pressable onPress={() => router.push('/transactionSummary')} className="w-full items-center justify-center bg-primary rounded-md active:bg-blue-700 py-8">
                            <Text className="text-white font-bold text-4xl">Submit</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  separator: {
    height: 4,
    backgroundColor: '#000000',
    marginVertical: 10,
    marginHorizontal: 0,
    borderRadius: 8,
  },
  pickerContainer: {
    height: 64, 
    marginBottom: 16, 
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
    borderColor: '#F2C94C', // <--- UPDATED COLOR
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
  }
});