import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

export default function MaterialsIndex() {
  // Dummy data for Materials
  // Context: Raw materials with SKU/ID and Unit of Measure (UOM)
  const materialsData = [
    { id: "M-101", name: "Steel Beams (H-Section)", sku: "ST-2023-A", stock: "450 pcs" },
    { id: "M-102", name: "Portland Cement", sku: "CM-50KG-X", stock: "120 bags" },
    { id: "M-103", name: "Copper Wire (12AWG)", sku: "EL-WR-12", stock: "5,000 m" },
    { id: "M-104", name: "Oak Lumber 2x4", sku: "WD-OAK-24", stock: "0 pcs" },
    { id: "M-105", name: "Insulation Foam", sku: "IN-FM-R13", stock: "200 rolls" },
    { id: "M-106", name: "PVC Piping 3-inch", sku: "PL-PVC-03", stock: "85 lengths" },
  ];

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* 1. TOP VIEW: Search and Add Button */}
      <View className="flex-[1] flex-row items-center justify-between">
        {/* Search Bar: Width 3/8 (37.5%) */}
        <View className="w-[37.5%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
          <Search size={20} color="gray" />
          <TextInput 
            placeholder="Search Material" 
            className="flex-1 ml-2 text-base text-gray-700"
          />
        </View>

        {/* New Material Button: Width 2/8 (25%) */}
        <Pressable className="w-[25%] h-full flex-row items-center justify-center bg-primary rounded-md py-2 active:bg-blue-700">
          <Plus size={20} color="white" />
          <Text className="text-white font-medium ml-2">New Material</Text>
        </Pressable>
      </View>

      {/* 2. MIDDLE VIEW: Non-scrollable Table */}
      <View className="flex-[12] bg-white rounded-lg overflow-hidden">
        {/* Table Header */}
        <View className="flex-row bg-gray-200 p-4 border-b border-gray-300">
          <Text className="flex-1 font-bold text-gray-700">Material Name</Text>
          <Text className="flex-1 font-bold text-gray-700">SKU / ID</Text>
          <Text className="flex-1 font-bold text-right text-gray-700">Current Stock</Text>
        </View>

        {/* Table Body - Occupies all remaining space */}
        <View className="flex-1">
          {materialsData.map((item, index) => (
            <Pressable 
              key={index} 
              className="flex-1 flex-row items-center p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-50"
            >
              {/* Material Name */}
              <Text className="flex-1 text-gray-800 font-medium">{item.name}</Text>
              
              {/* SKU / Identifier */}
              <Text className="flex-1 text-gray-500 text-xs uppercase tracking-wider">{item.sku}</Text>
              
              {/* Stock Level (Right Aligned) */}
              {/* Logic: If stock is 0, show red text, otherwise normal gray */}
              <Text className={`flex-1 text-right font-medium ${item.stock.startsWith("0") ? "text-red-500" : "text-gray-800"}`}>
                {item.stock}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 3. BOTTOM VIEW: Pagination (Unchanged) */}
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