import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

export default function Index() {
  // Updated dummy data aligned with Transactions schema
  const tableData = [
    { id: "TXN-001", type: "Buying", weight: "45.2 kg", amount: "₱2,260.00", date: "2023-10-01" },
    { id: "TXN-002", type: "Selling", weight: "120.0 kg", amount: "₱12,000.00", date: "2023-10-03" },
    { id: "TXN-003", type: "Buying", weight: "12.5 kg", amount: "₱625.00", date: "2023-10-05" },
    { id: "TXN-004", type: "Buying", weight: "8.0 kg", amount: "₱400.00", date: "2023-10-06" },
    { id: "TXN-005", type: "Selling", weight: "250.0 kg", amount: "₱25,000.00", date: "2023-10-01" },
    { id: "TXN-006", type: "Buying", weight: "30.0 kg", amount: "₱1,500.00", date: "2023-10-07" },
  ];

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* 1. TOP VIEW: Search and Add Button */}
      <View className="flex-[1] flex-row items-center justify-between">
        <View className="w-[37.5%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
          <Search size={20} color="gray" />
          <TextInput 
            placeholder="Search ID or Type..." 
            className="flex-1 ml-2 text-base text-gray-700"
          />
        </View>

        <Pressable className="w-[25%] h-full flex-row items-center justify-center bg-primary rounded-md py-2 active:bg-blue-700" onPress={() => router.push('/newTransaction')}>
          <Plus size={20} color="white" />
          <Text className="text-white font-medium ml-2">New Transaction</Text>
        </Pressable>
      </View>

      {/* 2. MIDDLE VIEW: Updated Table Columns */}
      <View className="flex-[12] bg-white rounded-lg overflow-hidden">
        {/* Table Header with proper column names */}
        <View className="flex-row bg-gray-200 p-4 border-b border-gray-300">
          <Text className="flex-1 font-bold text-gray-700 text-xs">ID</Text>
          <Text className="flex-1 font-bold text-gray-700 text-xs text-center">Type</Text>
          <Text className="flex-1 font-bold text-gray-700 text-xs text-center">Total Weight</Text>
          <Text className="flex-1 font-bold text-gray-700 text-xs text-right">Total Amount</Text>
          <Text className="flex-1 font-bold text-gray-700 text-xs text-right">Date</Text>
        </View>

        {/* Table Body mapping updated fields */}
        <View className="flex-1">
          {tableData.map((item, index) => (
            <Pressable 
              key={index} 
              onPress={() => router.push('/transactionDetailed')}
              className="flex-1 flex-row items-center p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-50"
            >
              <Text className="flex-1 text-gray-800 text-xs">{item.id}</Text>
              <Text className="flex-1 text-gray-600 text-xs text-center">{item.type}</Text>
              <Text className="flex-1 text-gray-800 text-xs text-center">{item.weight}</Text>
              <Text className="flex-1 text-right font-medium text-gray-800 text-xs">{item.amount}</Text>
              <Text className="flex-1 text-right text-gray-600 text-xs">{item.date}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 3. BOTTOM VIEW: Pagination */}
      <View className="flex-1 flex-row items-center justify-center gap-2">
        <Pressable className="p-2 bg-gray-200 rounded-md">
          <ChevronLeft size={20} color="gray" />
        </Pressable>
        <View className="px-4 py-2 bg-blue-600 rounded-md">
          <Text className="text-white font-bold">1</Text>
        </View>
        <Pressable className="p-2 bg-gray-200 rounded-md">
          <ChevronRight size={20} color="gray" />
        </Pressable>
      </View>
    </View>
  );
}