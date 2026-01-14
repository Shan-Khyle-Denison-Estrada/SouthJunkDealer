import { router } from "expo-router";
import { ChevronLeft, ChevronRight, ClipboardCheck, Package, Plus, Search } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

export default function InventoryIndex() {
  // Dummy data for Inventory
  const inventoryData = [
    { id: "001", name: "Wireless Mouse", sku: "PER-001", stock: "145" },
    { id: "002", name: "Mechanical Keyboard", sku: "PER-002", stock: "32" },
    { id: "003", name: "USB-C Hub", sku: "ACC-055", stock: "89" },
    { id: "004", name: "Monitor 27-inch", sku: "DIS-101", stock: "12" },
    { id: "005", name: "Laptop Stand", sku: "ACC-012", stock: "205" },
    { id: "006", name: "Webcam 1080p", sku: "PER-099", stock: "0" }, // Out of stock example
  ];

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* 1. TOP VIEW: Search and Action Buttons */}
      <View className="flex-[1] flex-row items-center justify-between">
        {/* Search Bar: Width 3/8 (37.5%) - Aligned Left */}
        <View className="w-[37.5%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
          <Search size={20} color="gray" />
          <TextInput 
            placeholder="Search Inventory Batch" 
            className="flex-1 ml-2 text-base text-gray-700"
          />
        </View>

        {/* Right Side Buttons Group */}
        <View className="flex-row gap-2 h-full">
            {/* Inventory Check Button */}
            <Pressable className="px-4 h-full flex-row items-center justify-center bg-white rounded-md active:bg-gray-50" onPress={() => router.push('/inventoryDetailed')}>
                <ClipboardCheck size={20} color="#4b5563" />
                <Text className="text-gray-700 font-medium ml-2">Inventory Check</Text>
            </Pressable>

            {/* New Item Button */}
            <Pressable className="px-4 h-full flex-row items-center justify-center bg-primary rounded-md active:bg-blue-700">
                <Plus size={20} color="white" />
                <Text className="text-white font-medium ml-2">New Inventory Batch</Text>
            </Pressable>
        </View>
      </View>

      {/* 2. MIDDLE VIEW: Inventory Table */}
      <View className="flex-[12] bg-white rounded-lg overflow-hidden">
        {/* Table Header */}
        <View className="flex-row bg-gray-200 p-4 border-b border-gray-300">
          <Text className="flex-1 font-bold text-gray-700">Item Name</Text>
          <Text className="flex-1 font-bold text-gray-700">SKU</Text>
          <Text className="flex-1 font-bold text-right text-gray-700">Stock Level</Text>
        </View>

        {/* Table Body */}
        <View className="flex-1">
          {inventoryData.map((item, index) => (
            <Pressable 
              key={index} 
              className="flex-1 flex-row items-center p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-50"
            >
              <View className="flex-1 flex-row items-center gap-2">
                 <Package size={16} color="gray" />
                 <Text className="text-gray-800 font-medium">{item.name}</Text>
              </View>
              <Text className="flex-1 text-gray-600">{item.sku}</Text>
              <Text className={`flex-1 text-right font-bold ${item.stock === "0" ? "text-red-500" : "text-gray-800"}`}>
                {item.stock}
              </Text>
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