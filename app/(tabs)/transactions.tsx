import { router, useFocusEffect } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";

// --- DATABASE IMPORTS ---
import { desc, eq } from 'drizzle-orm';
import { transactions } from '../../db/schema';
import { db } from '../_layout';

export default function TransactionsIndex() {
  const [transactionList, setTransactionList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      const data = await db.select()
        .from(transactions)
        .where(eq(transactions.status, 'Completed'))
        .orderBy(desc(transactions.id));
      
      setTransactionList(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load transactions");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // --- HANDLE NEW TRANSACTION ---
  const handleNewTransaction = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Create a blank draft immediately
        const result = await db.insert(transactions).values({
            date: today,
            status: 'Draft',
            totalAmount: 0,
        }).returning({ insertedId: transactions.id });

        const newId = result[0].insertedId;

        // 2. Redirect straight to Summary
        router.push({
            pathname: '/transactionSummary',
            params: { transactionId: newId }
        });

    } catch (error) {
        Alert.alert("Error", "Could not initialize transaction");
    }
  };

  const filteredList = transactionList.filter(item => 
    item.id.toString().includes(searchQuery) ||
    (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      <View className="flex-[1] flex-row items-center justify-between">
        <View className="w-[45%] h-full flex-row items-center bg-white rounded-md px-3">
          <Search size={24} color="gray" />
          <TextInput 
            placeholder="Search ID or Type..." 
            className="flex-1 ml-2 text-lg text-gray-700 h-full"
            style={{ textAlignVertical: 'center' }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Pressable 
          onPress={handleNewTransaction} // <--- UPDATED HANDLER
          className="w-[30%] h-full flex-row items-center justify-center bg-primary rounded-md py-2 active:bg-blue-700"
        >
          <Plus size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">New Transaction</Text>
        </Pressable>
      </View>

      <View className="flex-[12] bg-white rounded-lg overflow-hidden border border-gray-200">
        <View className="flex-row bg-gray-800 p-4">
          <Text className="flex-1 font-bold text-white text-center text-lg">ID</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Transaction Type</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Payment Method</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Date</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Total Amount</Text>
        </View>

        {filteredList.length === 0 ? (
           <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
              <Text style={{color: '#888'}}>No completed transactions found.</Text>
           </View>
        ) : (
          <FlatList 
            data={filteredList}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => (
              <Pressable 
                onPress={() => router.push({
                  pathname: '/transactionDetailed',
                  params: { transactionId: item.id }
              })}
                className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <Text className="flex-1 text-gray-800 text-center text-lg font-medium">{item.id}</Text>
                <Text className={`flex-1 text-center text-lg font-bold ${item.type === 'Selling' ? 'text-green-600' : 'text-blue-600'}`}>{item.type}</Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">{item.paymentMethod}</Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">{item.date}</Text>
                <Text className="flex-1 text-blue-700 text-center text-lg font-bold">₱{item.totalAmount?.toFixed(2)}</Text>
              </Pressable>
            )}
          />
        )}
      </View>

      <View className="flex-1 flex-row items-center justify-center gap-3">
        <Pressable className="p-3 bg-white border border-gray-300 rounded-md">
           <ChevronLeft size={24} color="black" />
        </Pressable>
        <View className="px-5 py-3 bg-blue-600 rounded-md">
           <Text className="text-white text-xl font-bold">1</Text>
        </View>
        <Pressable className="p-3 bg-white border border-gray-300 rounded-md">
           <ChevronRight size={24} color="black" />
        </Pressable>
      </View>
    </View>
  );
}