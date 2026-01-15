import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function Index() {
  // Updated dummy data to match the Transactions & Line Items schema
  const tableData = [
    { id: "TXN-1001", type: "Buying", weight: "45.5 kg", method: "Cash", date: "2023-10-01", amount: "₱1,220.50" },
    { id: "TXN-1002", type: "Selling", weight: "120.0 kg", method: "G-Cash", date: "2023-10-03", amount: "₱4,499.00" },
    { id: "TXN-1003", type: "Buying", weight: "12.2 kg", method: "Cash", date: "2023-10-05", amount: "₱855.20" },
    { id: "TXN-1004", type: "Buying", weight: "5.0 kg", method: "Cash", date: "2023-10-06", amount: "₱120.00" },
    { id: "TXN-1005", type: "Selling", weight: "250.8 kg", method: "Bank Transfer", date: "2023-10-01", amount: "₱12,000.00" },
    { id: "TXN-1006", type: "Buying", weight: "18.3 kg", method: "G-Cash", date: "2023-10-07", amount: "₱450.00" },
    { id: "TXN-1007", type: "Buying", weight: "18.3 kg", method: "G-Cash", date: "2023-10-07", amount: "₱48363.00" },
    { id: "TXN-1008", type: "Buying", weight: "18.3 kg", method: "G-Cash", date: "2023-10-07", amount: "₱4297052.00" },
    { id: "TXN-1009", type: "Buying", weight: "18.3 kg", method: "G-Cash", date: "2023-10-07", amount: "₱9625.00" },
  ];

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* 1. TOP VIEW: Search and Add Button */}
      <View className="flex-[1] flex-row items-center justify-between">
        <View className="w-[45%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
          <Search size={24} color="gray" />
          <TextInput 
            placeholder="Search ID or Type..." 
            className="flex-1 ml-2 text-lg text-gray-700"
          />
        </View>

        <Pressable 
          className="w-[30%] h-full flex-row items-center justify-center bg-primary rounded-md py-2 active:bg-yellow-500" 
          onPress={() => router.push('/newTransaction')}
        >
          <Plus size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">New Transaction</Text>
        </Pressable>
      </View>

      {/* 2. MIDDLE VIEW: Table with Proper Schema Columns */}
      <View className="flex-[12] bg-white rounded-lg overflow-hidden border border-gray-200">
        {/* Table Header */}
        <View className="flex-row bg-gray-800 p-4">
          <Text className="flex-1 font-bold text-white text-center text-lg">Transaction ID</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Type</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Weight</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Payment</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Date</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Total Amount</Text>
        </View>

        {/* Table Body */}
        <ScrollView className="flex-1">
          {tableData.map((item, index) => (
            <Pressable 
              key={index} 
              onPress={() => router.push('/transactionDetailed')}
              className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} active:bg-blue-50`}
            >
              <Text className="flex-1 text-gray-800 text-center text-lg font-medium">{item.id}</Text>
              <Text className="flex-1 text-gray-600 text-center text-lg">{item.type}</Text>
              <Text className="flex-1 text-gray-600 text-center text-lg">{item.weight}</Text>
              <Text className="flex-1 text-gray-600 text-center text-lg">{item.method}</Text>
              <Text className="flex-1 text-gray-600 text-center text-lg">{item.date}</Text>
              <Text className="flex-1 text-blue-700 text-center text-lg font-bold">{item.amount}</Text>
            </Pressable>
          ))}
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
          <Text className="text-gray-600 text-xl">2</Text>
        </View>

        <Pressable className="p-3 bg-white border border-gray-300 rounded-md">
          <ChevronRight size={24} color="black" />
        </Pressable>
      </View>
    </View>
  );
}