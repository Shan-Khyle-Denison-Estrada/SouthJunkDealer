import { Picker } from '@react-native-picker/picker';
import { router } from "expo-router"; // Added router for navigation
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ScanQR() {
    // State for Transaction Type and Payment
    const [transactionType, setTransactionType] = useState();
    const [isTransTypeFocused, setIsTransTypeFocused] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState();
    const [isPaymentMethodFocused, setIsPaymentMethodFocused] = useState(false);

    // Modal States
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // 15 Dummy Data Items (Based on Transaction Line Items Schema)
    const lineItems = [
        { id: "L-101", material: "PET Bottles", weight: "15.0 kg", price: "₱12.00", subtotal: "₱180.00" },
        { id: "L-102", material: "Aluminum Cans", weight: "8.5 kg", price: "₱45.00", subtotal: "₱382.50" },
        { id: "L-103", material: "Copper Wire", weight: "2.3 kg", price: "₱320.00", subtotal: "₱736.00" },
        { id: "L-104", material: "Cardboard", weight: "50.0 kg", price: "₱5.00", subtotal: "₱250.00" },
        { id: "L-105", material: "Glass Bottles", weight: "20.0 kg", price: "₱8.00", subtotal: "₱160.00" },
        { id: "L-106", material: "Mixed Paper", weight: "30.0 kg", price: "₱3.50", subtotal: "₱105.00" },
        { id: "L-107", material: "Steel Scraps", weight: "100.0 kg", price: "₱15.00", subtotal: "₱1,500.00" },
        { id: "L-108", material: "HDPE Plastic", weight: "12.0 kg", price: "₱18.00", subtotal: "₱216.00" },
        { id: "L-109", material: "Lead Battery", weight: "15.5 kg", price: "₱60.00", subtotal: "₱930.00" },
        { id: "L-110", material: "Brass Plumbing", weight: "4.2 kg", price: "₱180.00", subtotal: "₱756.00" },
        { id: "L-111", material: "LDPE Film", weight: "25.0 kg", price: "₱9.00", subtotal: "₱225.00" },
        { id: "L-112", material: "Cast Iron", weight: "45.0 kg", price: "₱14.00", subtotal: "₱630.00" },
        { id: "L-113", material: "Radiators", weight: "6.8 kg", price: "₱95.00", subtotal: "₱646.00" },
        { id: "L-114", material: "Newspaper", weight: "40.0 kg", price: "₱4.00", subtotal: "₱160.00" },
        { id: "L-115", material: "Clean Aluminum", weight: "10.0 kg", price: "₱55.00", subtotal: "₱550.00" },
    ];

    const handleRowPress = (item) => {
        setSelectedItem(item);
        setIsModalVisible(true);
    };

    return (
        <View className="flex-1 gap-4 p-4">
            {/* MODAL FOR EDIT/DELETE ACTIONS */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text className="text-2xl font-bold mb-6 text-center">
                            Options for {selectedItem?.id}
                        </Text>
                        
                        <TouchableOpacity 
                            className="bg-blue-600 w-full py-4 rounded-md mb-4"
                            onPress={() => {
                                setIsModalVisible(false);
                                router.push('/newTransaction');
                            }}
                        >
                            <Text className="text-white text-center text-xl font-bold">Edit Item</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className="bg-red-600 w-full py-4 rounded-md mb-4"
                            onPress={() => setIsModalVisible(false)}
                        >
                            <Text className="text-white text-center text-xl font-bold">Delete Item</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className="bg-gray-300 w-full py-4 rounded-md"
                            onPress={() => setIsModalVisible(false)}
                        >
                            <Text className="text-gray-800 text-center text-xl font-bold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* TOP SECTION: INPUTS */}
            <View className="flex-[4] px-4">
                <View className="flex-1 mb-4">
                    <Text className="font-semibold text-2xl">Transaction Details</Text>
                </View>

                {/* ROW 1: CLIENT NAMES */}
                <View className="flex-[4] gap-4 flex-row mb-4">
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">Client First Name</Text>
                        <TextInput className="bg-white rounded-md px-4 text-black text-2xl flex-1" placeholder="Juan" placeholderTextColor="#9ca3af" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">Client Middle Name</Text>
                        <TextInput className="bg-white rounded-md px-4 text-black text-2xl flex-1" placeholder="Chinito" placeholderTextColor="#9ca3af" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">Client Last Name</Text>
                        <TextInput className="bg-white rounded-md px-4 text-black text-2xl flex-1" placeholder="Dela Cruz" placeholderTextColor="#9ca3af" />
                    </View>
                </View>

                {/* ROW 2: DROPDOWNS */}
                <View className="flex-[4] gap-4 flex-row">
                    {/* TRANSACTION TYPE */}
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">Transaction Type</Text>
                        <View style={[styles.pickerContainer, isTransTypeFocused && styles.pickerFocused]}>
                            <View style={styles.visualContainer}>
                                <Text style={[styles.pickerText, !transactionType && styles.placeholderText]} numberOfLines={1}>
                                    {transactionType ? transactionType.charAt(0).toUpperCase() + transactionType.slice(1) : "Select Type..."}
                                </Text>
                                <View style={styles.arrowContainer}><View style={[styles.roundedArrow, isTransTypeFocused && styles.arrowOpen]} /></View>
                            </View>
                            <Picker selectedValue={transactionType} onValueChange={(v) => { setTransactionType(v); setIsTransTypeFocused(false); }} onFocus={() => setIsTransTypeFocused(true)} onBlur={() => setIsTransTypeFocused(false)} style={styles.invisiblePicker} mode="dropdown">
                                <Picker.Item label="Select Type..." value={null} enabled={false} />
                                <Picker.Item label="Buying" value="buying" />
                                <Picker.Item label="Selling" value="selling" />
                            </Picker>
                        </View>
                    </View>

                    {/* PAYMENT METHOD */}
                    <View className="flex-1">
                        <Text className="text-lg mb-2 ml-1">Payment Method</Text>
                        <View style={[styles.pickerContainer, isPaymentMethodFocused && styles.pickerFocused]}>
                            <View style={styles.visualContainer}>
                                <Text style={[styles.pickerText, !paymentMethod && styles.placeholderText]} numberOfLines={1}>
                                    {paymentMethod ? paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) : "Select Method..."}
                                </Text>
                                <View style={styles.arrowContainer}><View style={[styles.roundedArrow, isPaymentMethodFocused && styles.arrowOpen]} /></View>
                            </View>
                            <Picker selectedValue={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setIsPaymentMethodFocused(false); }} onFocus={() => setIsPaymentMethodFocused(true)} onBlur={() => setIsPaymentMethodFocused(false)} style={styles.invisiblePicker} mode="dropdown">
                                <Picker.Item label="Select Method..." value={null} enabled={false} />
                                <Picker.Item label="Cash" value="cash" />
                                <Picker.Item label="GCash" value="gcash" />
                            </Picker>
                        </View>
                    </View>
                </View>
            </View>

            {/* MIDDLE SECTION: THE BIGGEST VIEW (Table for Line Items) */}
            <View className="flex-[7] bg-white rounded-lg overflow-hidden">
                {/* Table Header */}
                <View className="flex-row bg-gray-800 p-4">
                    <Text className="flex-1 font-bold text-white text-center text-lg">ID</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Material</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Weight</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Price/Unit</Text>
                    <Text className="flex-1 font-bold text-white text-center text-lg">Subtotal</Text>
                </View>

                {/* Table Body */}
                <ScrollView className="flex-1">
                    {lineItems.map((item, index) => (
                        <TouchableOpacity 
                            key={index} 
                            onPress={() => handleRowPress(item)}
                            className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} active:bg-blue-50`}
                        >
                            <Text className="flex-1 text-gray-800 text-center text-lg font-medium">{item.id}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.material}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.weight}</Text>
                            <Text className="flex-1 text-gray-600 text-center text-lg">{item.price}</Text>
                            <Text className="flex-1 text-blue-700 text-center text-lg font-bold">{item.subtotal}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Total Summary Footer */}
                <View className="h-20 bg-gray-300 flex-row justify-center items-center gap-2">
                    <Text className="font-semibold text-2xl text-gray-700">Total:</Text>
                    <Text className="font-bold text-3xl text-black">₱7,429.00</Text>
                </View>
            </View>

            {/* BOTTOM SECTION: ACTIONS */}
            <View className="flex-1 flex-row gap-4 px-4">
                <TouchableOpacity className="bg-red-600 flex-1 justify-center items-center rounded-md" onPress={() => router.push('/transactions')}>
                    <Text className="font-semibold text-2xl text-white">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-blue-500 flex-1 justify-center items-center rounded-md">
                    <Text className="font-semibold text-2xl text-white">Print</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-primary flex-1 justify-center items-center rounded-md" onPress={() => router.push('/newTransaction')}>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 30,
        width: '50%',
        alignItems: 'center',
        elevation: 5
    },
    pickerContainer: {
      flex: 1, backgroundColor: 'white', borderRadius: 6, justifyContent: 'center', position: 'relative', overflow: 'hidden', width: '100%', borderWidth: 2, borderColor: 'transparent', 
    },
    pickerFocused: { borderColor: '#F2C94C', },
    visualContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: '100%', width: '100%', },
    pickerText: { fontSize: 24, color: 'black', flex: 1, marginRight: 10, },
    placeholderText: { color: '#9ca3af', },
    arrowContainer: { justifyContent: 'center', alignItems: 'center', width: 20, height: 20, },
    roundedArrow: { width: 12, height: 12, borderBottomWidth: 3, borderRightWidth: 3, borderColor: 'black', transform: [{ rotate: '45deg' }], marginTop: -4, borderRadius: 2, },
    arrowOpen: { transform: [{ rotate: '225deg' }], marginTop: 4, },
    invisiblePicker: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, width: '100%', height: '100%', }
  });