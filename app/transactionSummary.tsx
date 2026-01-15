import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ScanQR() {
    // State for Transaction Type
    const [transactionType, setTransactionType] = useState();
    const [isTransTypeFocused, setIsTransTypeFocused] = useState(false);

    // State for Payment Method
    const [paymentMethod, setPaymentMethod] = useState();
    const [isPaymentMethodFocused, setIsPaymentMethodFocused] = useState(false);

    return (
        <View className="flex-1 gap-4 p-4">
            {/* TOP SECTION: INPUTS */}
            <View className="flex-[4] px-4">
                <View className="flex-1 mb-4">
                    <Text className="font-semibold text-2xl">Transaction Details</Text>
                </View>

                {/* ROW 1: CLIENT NAMES */}
                <View className="flex-[4] gap-4 flex-row mb-4">
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">
                            Client First Name
                        </Text>
                        <TextInput 
                            className="bg-white rounded-md px-4 text-black text-2xl flex-1"
                            placeholder="Juan"
                            placeholderTextColor="#9ca3af"
                            // Removed fixed height (h-16), added flex-1 to fill space
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">
                            Client Middle Name
                        </Text>
                        <TextInput 
                            className="bg-white rounded-md px-4 text-black text-2xl flex-1"
                            placeholder="Chinito"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">
                            Client Last Name
                        </Text>
                        <TextInput 
                            className="bg-white rounded-md px-4 text-black text-2xl flex-1"
                            placeholder="Dela Cruz"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>

                {/* ROW 2: DROPDOWNS */}
                <View className="flex-[4] gap-4 flex-row">
                    
                    {/* TRANSACTION TYPE DROPDOWN */}
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">
                            Transaction Type
                        </Text>
                        <View style={[
                            styles.pickerContainer,
                            isTransTypeFocused && styles.pickerFocused 
                        ]}>
                            {/* Visual Layer */}
                            <View style={styles.visualContainer}>
                                <Text 
                                    style={[
                                        styles.pickerText, 
                                        !transactionType && styles.placeholderText 
                                    ]}
                                    numberOfLines={1} 
                                >
                                    {transactionType 
                                        ? transactionType.charAt(0).toUpperCase() + transactionType.slice(1) 
                                        : "Select Type..."
                                    }
                                </Text>
                                <View style={styles.arrowContainer}>
                                    <View style={[
                                        styles.roundedArrow,
                                        isTransTypeFocused && styles.arrowOpen 
                                    ]} />
                                </View>
                            </View>

                            {/* Functional Layer */}
                            <Picker
                                selectedValue={transactionType}
                                onValueChange={(itemValue) => {
                                    setTransactionType(itemValue);
                                    setIsTransTypeFocused(false);
                                }}
                                onFocus={() => setIsTransTypeFocused(true)}
                                onBlur={() => setIsTransTypeFocused(false)}
                                style={styles.invisiblePicker}
                                mode="dropdown" 
                            >
                                <Picker.Item label="Select Type..." value={null} enabled={false} />
                                <Picker.Item label="Buying" value="buying" />
                                <Picker.Item label="Selling" value="selling" />
                                <Picker.Item label="Return" value="return" />
                            </Picker>
                        </View>
                    </View>

                    {/* PAYMENT METHOD DROPDOWN */}
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">
                            Payment Method
                        </Text>
                        <View style={[
                            styles.pickerContainer,
                            isPaymentMethodFocused && styles.pickerFocused 
                        ]}>
                            {/* Visual Layer */}
                            <View style={styles.visualContainer}>
                                <Text 
                                    style={[
                                        styles.pickerText, 
                                        !paymentMethod && styles.placeholderText 
                                    ]}
                                    numberOfLines={1} 
                                >
                                    {paymentMethod 
                                        ? paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) 
                                        : "Select Method..."
                                    }
                                </Text>
                                <View style={styles.arrowContainer}>
                                    <View style={[
                                        styles.roundedArrow,
                                        isPaymentMethodFocused && styles.arrowOpen 
                                    ]} />
                                </View>
                            </View>

                            {/* Functional Layer */}
                            <Picker
                                selectedValue={paymentMethod}
                                onValueChange={(itemValue) => {
                                    setPaymentMethod(itemValue);
                                    setIsPaymentMethodFocused(false);
                                }}
                                onFocus={() => setIsPaymentMethodFocused(true)}
                                onBlur={() => setIsPaymentMethodFocused(false)}
                                style={styles.invisiblePicker}
                                mode="dropdown" 
                            >
                                <Picker.Item label="Select Method..." value={null} enabled={false} />
                                <Picker.Item label="Cash" value="cash" />
                                <Picker.Item label="Check" value="check" />
                                <Picker.Item label="Bank Transfer" value="bank_transfer" />
                                <Picker.Item label="GCash" value="gcash" />
                            </Picker>
                        </View>
                    </View>
                </View>
            </View>

            {/* MIDDLE SECTION: TABLE / LIST */}
            <View className="flex-[7] border-black border-4 rounded-md overflow-clip">
                <View className="flex-[7]">
                    {/* List Items would go here */}
                </View>
                <View className="flex-1 bg-gray-300 flex-row justify-center items-center gap-2">
                    <Text className="font-semibold text-xl">
                        Total:
                    </Text>
                    <Text className="font-bold text-2xl">
                        69,000 Php
                    </Text>
                </View>
            </View>

            {/* BOTTOM SECTION: ACTIONS */}
            <View className="flex-1 flex-row gap-4 px-4">
                <TouchableOpacity className="bg-red-600 flex-1 justify-center items-center rounded-md">
                    <Text className="font-semibold text-2xl text-white">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-blue-500 flex-1 justify-center items-center rounded-md">
                    <Text className="font-semibold text-2xl text-white">Print</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-primary flex-1 justify-center items-center rounded-md">
                    <Text className="font-semibold text-2xl text-white">Add</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-green-500 flex-1 justify-center items-center rounded-md">
                    <Text className="font-semibold text-2xl text-white">Done</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    pickerContainer: {
      flex: 1, // Changed from fixed height to flex: 1 to fill vertical space
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
      height: '100%', // Ensure it covers the flexed container
    }
  });