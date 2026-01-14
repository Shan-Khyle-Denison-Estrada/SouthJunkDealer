import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

export default function Index() {
  // Dummy data for the table
  const tableData = [
    { id: "001", name: "Grocery Market", date: "2023-10-01", amount: "$120.50" },
    { id: "002", name: "Tech Gadgets Inc", date: "2023-10-03", amount: "$499.00" },
    { id: "003", name: "City Utilities", date: "2023-10-05", amount: "$85.20" },
    { id: "004", name: "Corner Cafe", date: "2023-10-06", amount: "$12.00" },
    { id: "005", name: "Monthly Rent", date: "2023-10-01", amount: "$1200.00" },
    { id: "006", name: "Gym Membership", date: "2023-10-07", amount: "$45.00" },
  ];

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* 1. TOP VIEW: Search and Add Button */}
      <View className="flex-[1] flex-row items-center justify-between">
        {/* Search Bar: Width 3/8 (37.5%) */}
        <View className="w-[37.5%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
          <Search size={20} color="gray" />
          <TextInput 
            placeholder="Search Transaction" 
            className="flex-1 ml-2 text-base text-gray-700"
          />
        </View>

        {/* New Transaction Button: Width 2/8 (25%) */}
        <Pressable className="w-[25%] h-full flex-row items-center justify-center bg-primary rounded-md py-2 active:bg-blue-700" onPress={() => router.push('/newTransaction')}>
          <Plus size={20} color="white" />
          <Text className="text-white font-medium ml-2">New Transaction</Text>
        </Pressable>
      </View>

      {/* 2. MIDDLE VIEW: Non-scrollable Table */}
      <View className="flex-[12] bg-white rounded-lg overflow-hidden">
        {/* Table Header */}
        <View className="flex-row bg-gray-200 p-4 border-b border-gray-300">
          <Text className="flex-1 font-bold text-gray-700">Transaction</Text>
          <Text className="flex-1 font-bold text-gray-700">Date</Text>
          <Text className="flex-1 font-bold text-right text-gray-700">Amount</Text>
        </View>

        {/* Table Body - Occupies all remaining space */}
        <View className="flex-1">
          {tableData.map((item, index) => (
            <Pressable 
              key={index} 
              onPress={() => router.push('/transactionDetailed')}
              className="flex-1 flex-row items-center p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-50"
            >
              <Text className="flex-1 text-gray-800">{item.name}</Text>
              <Text className="flex-1 text-gray-600">{item.date}</Text>
              <Text className="flex-1 text-right font-medium text-gray-800">{item.amount}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 3. BOTTOM VIEW: Pagination (No Background) */}
      <View className="flex-1 flex-row items-center justify-center gap-2">
        <Pressable className="p-2 bg-gray-200 rounded-md">
          <ChevronLeft size={20} color="gray" />
        </Pressable>
        
        <View className="px-4 py-2 bg-blue-600 rounded-md">
          <Text className="text-white font-bold">1</Text>
        </View>
        <View className="px-4 py-2 bg-white rounded-md border border-gray-200">
          <Text className="text-gray-600">2</Text>
        </View>
        <View className="px-4 py-2 bg-white rounded-md border border-gray-200">
          <Text className="text-gray-600">3</Text>
        </View>

        <Pressable className="p-2 bg-gray-200 rounded-md">
          <ChevronRight size={20} color="gray" />
        </Pressable>
      </View>
    </View>
  );
}