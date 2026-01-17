import { router, useFocusEffect } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

// --- DATABASE IMPORTS ---
import { desc, eq } from 'drizzle-orm';
import { auditTrails, inventory } from '../../db/schema';
import { db } from './_layout';

export default function AuditIndex() {
  const [auditData, setAuditData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadAuditData = async () => {
    try {
        const result = await db.select({
            id: auditTrails.id,
            batchId: inventory.batchId,
            action: auditTrails.action,
            note: auditTrails.notes,
            date: auditTrails.date
        })
        .from(auditTrails)
        .leftJoin(inventory, eq(auditTrails.inventoryId, inventory.id))
        // UPDATED: Sort by ID descending to ensure absolute newest entries are on top
        .orderBy(desc(auditTrails.id));

        setAuditData(result);
    } catch (e) {
        console.error("Failed to load audit trails", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
        loadAuditData();
    }, [])
  );

  // --- HELPER FUNCTIONS ---
  const truncate = (str, n) => {
    if (!str) return "";
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'verified': return 'text-green-600';
      case 'damaged': return 'text-red-600';
      case 'adjusted': return 'text-blue-600';
      case 'added': return 'text-[#F2C94C]';
      default: return 'text-gray-800';
    }
  };

  // Filter based on search
  const filteredData = auditData.filter(item => 
      item.batchId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.id.toString().includes(searchQuery)
  );

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* 1. TOP VIEW: Search and Inventory Button */}
      <View className="flex-[1] flex-row items-center justify-between">
        <View className="w-[45%] h-full flex-row items-center bg-white rounded-md px-3 border border-gray-200">
          <Search size={20} color="gray" />
          <TextInput 
            placeholder="Search Audit..." 
            className="flex-1 ml-2 text-base text-gray-700 h-full"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Pressable 
          onPress={() => router.push('/scannedInventory')} 
          className="px-4 h-full flex-row items-center justify-center bg-primary rounded-md active:bg-yellow-500"
        >
          <Plus size={24} color="white" />
          <Text className="text-white font-bold text-lg ml-2">New Audit</Text>
        </Pressable>
      </View>

      {/* 2. MIDDLE VIEW: Table (READ ONLY) */}
      <View className="flex-[12] bg-white rounded-lg overflow-hidden border border-gray-200">
        <View className="flex-row bg-gray-800 p-4">
          <Text className="flex-1 font-bold text-white text-center text-lg">Audit ID</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Batch ID</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Action</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Note</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Date</Text>
        </View>

        <ScrollView>
          {filteredData.length === 0 ? (
              <View className="p-8 items-center"><Text className="text-gray-400">No audit records found.</Text></View>
          ) : (
            filteredData.map((item, index) => (
                <Pressable
                  key={item.id}
                  // Navigate to Details Page with ID
                  onPress={() => router.push({ pathname: '/detailedAuditTrail', params: { id: item.id } })}
                  className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} active:bg-blue-50`}
                >
                <Text className="flex-1 text-gray-800 text-center text-lg font-medium">AUD-{item.id}</Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">{item.batchId}</Text>
                <Text className={`flex-1 text-center text-lg font-bold ${getActionColor(item.action)}`}>{item.action}</Text>
                <Text className="flex-1 text-gray-600 text-center text-lg" numberOfLines={1}>
                    {truncate(item.note, 20)}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">{item.date}</Text>
                </Pressable>
            ))
          )}
        </ScrollView>
      </View>

      {/* 3. BOTTOM VIEW: Pagination */}
      <View className="flex-1 flex-row items-center justify-center gap-3">
        <Pressable className="p-3 bg-white border border-gray-300 rounded-md">
          <ChevronLeft size={24} color="black" />
        </Pressable>
        
        <View className="px-5 py-3 bg-blue-600 rounded-md">
          <Text className="text-white text-xl font-bold">1</Text>
        </View>
        <View className="px-5 py-3 bg-white rounded-md border border-gray-300">
          <Text className="text-gray-600 text-xl font-bold">2</Text>
        </View>
        <View className="px-5 py-3 bg-white rounded-md border border-gray-300">
          <Text className="text-gray-600 text-xl font-bold">3</Text>
        </View>

        <Pressable className="p-3 bg-white border border-gray-300 rounded-md">
          <ChevronRight size={24} color="black" />
        </Pressable>
      </View>
    </View>
  );
}