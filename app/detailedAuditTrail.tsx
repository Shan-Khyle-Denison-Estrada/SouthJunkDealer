import { router } from "expo-router";
import { Camera } from "lucide-react-native";
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DetailedAuditTrail() {
    // --- MOCK DATA ---
    const auditDetails = {
        auditId: "AUD-1002",
        batchId: "BATCH-9021-A",
        status: "Damaged",
        originalWeight: "450.0 kg",
        adjustedWeight: "442.5 kg",
        date: "2023-10-27",
        notes: "Found 3 broken seals and water damage on the bottom layer of the pallet. Adjusted weight reflects removal of compromised items.",
    };

    // --- DUMMY TRANSACTION LINE ITEMS ---
    const lineItems = [
        { id: "L-101", material: "PET Bottles", totalW: "15.0 kg", inclW: "14.5 kg", price: "₱12.00", subtotal: "₱180.00" },
        { id: "L-102", material: "Aluminum Cans", totalW: "8.5 kg", inclW: "8.0 kg", price: "₱45.00", subtotal: "₱382.50" },
        { id: "L-103", material: "Copper Wire", totalW: "2.3 kg", inclW: "2.3 kg", price: "₱320.00", subtotal: "₱736.00" },
        { id: "L-104", material: "Cardboard", totalW: "50.0 kg", inclW: "48.0 kg", price: "₱5.00", subtotal: "₱250.00" },
        { id: "L-105", material: "Glass Bottles", totalW: "20.0 kg", inclW: "19.0 kg", price: "₱8.00", subtotal: "₱160.00" },
        { id: "L-106", material: "Mixed Paper", totalW: "30.0 kg", inclW: "30.0 kg", price: "₱3.50", subtotal: "₱105.00" },
        { id: "L-107", material: "Steel Scraps", totalW: "100.0 kg", inclW: "98.5 kg", price: "₱15.00", subtotal: "₱1,500.00" },
        { id: "L-108", material: "HDPE Plastic", totalW: "12.0 kg", inclW: "11.5 kg", price: "₱18.00", subtotal: "₱216.00" },
        { id: "L-109", material: "Lead Battery", totalW: "15.5 kg", inclW: "15.5 kg", price: "₱60.00", subtotal: "₱930.00" },
        { id: "L-110", material: "Brass Plumbing", totalW: "4.2 kg", inclW: "4.0 kg", price: "₱180.00", subtotal: "₱756.00" },
        { id: "L-111", material: "LDPE Film", totalW: "25.0 kg", inclW: "24.0 kg", price: "₱9.00", subtotal: "₱225.00" },
        { id: "L-112", material: "Cast Iron", totalW: "45.0 kg", inclW: "44.0 kg", price: "₱14.00", subtotal: "₱630.00" },
        { id: "L-113", material: "Radiators", totalW: "6.8 kg", inclW: "6.8 kg", price: "₱95.00", subtotal: "₱646.00" },
        { id: "L-114", material: "Newspaper", totalW: "40.0 kg", inclW: "40.0 kg", price: "₱4.00", subtotal: "₱160.00" },
        { id: "L-115", material: "Clean Alum.", totalW: "10.0 kg", inclW: "9.8 kg", price: "₱55.00", subtotal: "₱550.00" },
    ];

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'verified': return 'text-green-600';
            case 'damaged': return 'text-red-600';
            case 'adjusted': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <View className="flex-1 px-4 bg-gray-100">
            <View className="flex-1 gap-4 py-4">
                
                {/* --- LAYER 1: IDs and Status Check --- */}
                <View className="flex-row gap-4 h-20">
                    <View className="flex-1 justify-center">
                        <Text className="text-gray-500 font-bold mb-1 uppercase tracking-widest text-xs">Audit ID</Text>
                        <TextInput 
                            className="bg-gray-200 rounded-md px-3 h-12 text-lg font-bold text-gray-700 border border-gray-300" 
                            value={auditDetails.auditId}
                            editable={false}
                        />
                    </View>
                    <View className="flex-1 justify-center">
                        <Text className="text-gray-500 font-bold mb-1 uppercase tracking-widest text-xs">Batch ID</Text>
                        <TextInput 
                            className="bg-gray-200 rounded-md px-3 h-12 text-lg font-bold text-gray-700 border border-gray-300" 
                            value={auditDetails.batchId}
                            editable={false}
                        />
                    </View>
                    <View className="flex-1 justify-center">
                        <Text className="text-gray-600 font-bold mb-1 uppercase tracking-widest text-xs">Status Check</Text>
                        <View className="bg-white h-12 rounded-md justify-center items-center border border-gray-300">
                            <Text className={`font-bold text-xl uppercase ${getStatusColor(auditDetails.status)}`}>
                                {auditDetails.status}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* --- LAYER 2: 3 Columns x 2 Rows Grid --- */}
                <View className="flex-row gap-4">
                    
                    {/* Left Side Container (Takes up Columns 1 & 2) */}
                    <View className="flex-[2] gap-4">
                        
                        {/* Row 1: Original & Adjusted Weights (Spaces 1 & 2) */}
                        <View className="flex-row gap-4 h-20">
                            <View className="flex-1">
                                <Text className="text-gray-600 font-bold mb-1 text-xs">Original Wt.</Text>
                                <TextInput 
                                    className="bg-gray-200 flex-1 rounded-md px-3 text-gray-600 font-medium text-lg" 
                                    value={auditDetails.originalWeight}
                                    editable={false}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-600 font-bold mb-1 text-xs">Adjusted Wt.</Text>
                                <TextInput 
                                    className={`flex-1 rounded-md px-3 font-bold text-lg border ${auditDetails.status !== 'Verified' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-gray-200 border-gray-200 text-gray-400'}`}
                                    value={auditDetails.adjustedWeight}
                                    editable={false}
                                />
                            </View>
                        </View>

                        {/* Row 2: Audit Notes (Spaces 4 & 5) - Taller Height */}
                        <View className="h-40">
                            <Text className="text-gray-600 font-bold mb-1 text-xs">Audit Notes</Text>
                            <TextInput 
                                className="bg-white flex-1 rounded-md p-3 text-base border border-gray-300 text-gray-700 leading-5" 
                                multiline={true}
                                editable={false}
                                value={auditDetails.notes}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Right Side Container (Column 3, Spaces 3 & 6) */}
                    <View className="flex-1">
                        <Text className="text-gray-600 font-bold mb-1 text-xs">Proof / Image</Text>
                        {/* This container automatically stretches to match the full height of the left side (approx h-64 total) */}
                        <View className="bg-gray-300 flex-1 rounded-md border-2 border-dashed border-gray-400 justify-center items-center">
                            <Camera size={40} color="gray" />
                            <Text className="text-gray-500 font-semibold mt-2 text-xs">View Image</Text>
                        </View>
                    </View>

                </View>

                {/* --- TABLE SECTION --- */}
                <View className="flex-1 mt-1">
                    <Text className="text-gray-600 font-bold mb-1 text-xs">Transaction Line Items</Text>
                    <View className="bg-white flex-1 rounded-md border border-gray-200 overflow-hidden">
                        <View className="flex-row bg-gray-800 p-3">
                            <Text className="flex-1 font-bold text-white text-center text-sm">ID</Text>
                            <Text className="flex-1 font-bold text-white text-center text-sm">Material</Text>
                            <Text className="flex-1 font-bold text-white text-center text-sm">Total Weight</Text>
                            <Text className="flex-1 font-bold text-white text-center text-sm">Included Weight</Text>
                            <Text className="flex-1 font-bold text-white text-center text-sm">Price/Unit</Text>
                            <Text className="flex-1 font-bold text-white text-center text-sm">Subtotal</Text>
                        </View>
                        
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                            {lineItems.map((item, index) => (
                                <View 
                                    key={index} 
                                    className={`flex-row items-center p-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                >
                                    <Text className="flex-1 text-gray-800 text-center text-xs font-medium">{item.id}</Text>
                                    <Text className="flex-1 text-gray-600 text-center text-xs">{item.material}</Text>
                                    <Text className="flex-1 text-gray-600 text-center text-xs">{item.totalW}</Text>
                                    <Text className="flex-1 text-gray-600 text-center text-xs">{item.inclW}</Text>
                                    <Text className="flex-1 text-gray-600 text-center text-xs">{item.price}</Text>
                                    <Text className="flex-1 text-blue-700 text-center text-xs font-bold">{item.subtotal}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        
                        <View className="h-10 bg-gray-200 flex-row justify-center items-center gap-2">
                            <Text className="font-semibold text-gray-700 text-xs">Total Value:</Text>
                            <Text className="font-bold text-sm text-black">₱5,185.50</Text>
                        </View>
                    </View>
                </View>

                {/* --- ACTION BUTTONS --- */}
                <View className="h-16 flex-row gap-4 mb-2">
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="bg-gray-500 flex-1 justify-center items-center rounded-md"
                    >
                        <Text className="font-semibold text-lg text-white">Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className="bg-blue-600 flex-1 justify-center items-center rounded-md"
                    >
                        <Text className="font-semibold text-lg text-white">Export Report</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}