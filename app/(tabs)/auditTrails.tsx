import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function AuditIndex() {
  // --- DUMMY DATA ---
  // Columns: Audit ID, Inventory Batch ID, Action Taken, Note, Date
  const auditData = [
    { id: "AUD-1001", batchId: "BATCH-8829-X", action: "Added", note: "All items checked and accounted for without issues.", date: "2023-10-27" },
    { id: "AUD-1002", batchId: "BATCH-9021-A", action: "Damaged", note: "Found 3 broken seals and water damage on the bottom layer of the pallet.", date: "2023-10-27" },
    { id: "AUD-1003", batchId: "BATCH-7712-C", action: "Adjusted", note: "FWeight discrepancy detected. Adjusted from 50kg to 48.5kg after re-weighing.", date: "2023-10-26" },
    { id: "AUD-1004", batchId: "BATCH-3321-B", action: "Verified", note: "Routine check completed.", date: "2023-10-26" },
    { id: "AUD-1005", batchId: "BATCH-1102-D", action: "Damaged", note: "Rat infestation signs observed near the storage rack. Flagged for cleaning.", date: "2023-10-25" },
    { id: "AUD-1006", batchId: "BATCH-5543-F", action: "Adjusted", note: "Manual override approved by supervisor.", date: "2023-10-25" },
    { id: "AUD-1007", batchId: "BATCH-6678-G", action: "Verified", note: "Stock matches system records perfectly.", date: "2023-10-24" },
    { id: "AUD-1008", batchId: "BATCH-9988-H", action: "Added", note: "No issues found during random spot check.", date: "2023-10-24" },
  ];

  // --- HELPER FUNCTIONS ---
  
  // Truncate text if it exceeds a certain length (e.g., 25 characters)
  const truncate = (str, n) => {
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
  };

  // Color coding for actions
  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case 'verified': return 'text-green-600';
      case 'damaged': return 'text-red-600';
      case 'adjusted': return 'text-blue-600';
      case 'added': return 'text-[#F2C94C]'; // Updated to use the primary color #F2C94C
      default: return 'text-gray-800';
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* 1. TOP VIEW: Search and Inventory Button */}
      <View className="flex-[1] flex-row items-center justify-between">
        <View className="w-[45%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
          <Search size={24} color="gray" />
          <TextInput 
            placeholder="Search Audit ID..." 
            className="flex-1 ml-2 text-lg text-gray-700"
          />
        </View>

        <Pressable 
          className="w-[30%] h-full flex-row items-center justify-center bg-primary rounded-md py-2 active:bg-yellow-500" 
          onPress={() => router.push('/scannedInventory')}
        >
          <Plus size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">New Audit Trail</Text>
        </Pressable>
      </View>

      {/* 2. MIDDLE VIEW: Table with Consistent Design */}
      <View className="flex-[12] bg-white rounded-lg overflow-hidden border border-gray-200">
        {/* Table Header - Dark Background, Bold White Text */}
        <View className="flex-row bg-gray-800 p-4">
          <Text className="flex-1 font-bold text-white text-center text-lg">Audit ID</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Batch ID</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Action</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Note</Text>
          <Text className="flex-1 font-bold text-white text-center text-lg">Date</Text>
        </View>

        {/* Table Body - Scrollable */}
        <ScrollView className="flex-1">
          {auditData.map((item, index) => (
            <Pressable
              onPress={() => router.push('/detailedAuditTrail')}
              key={index} 
              className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} active:bg-blue-50`}
            >
              <Text className="flex-1 text-gray-800 text-center text-lg font-medium">{item.id}</Text>
              <Text className="flex-1 text-gray-600 text-center text-lg">{item.batchId}</Text>
              <Text className={`flex-1 text-center text-lg font-bold ${getActionColor(item.action)}`}>{item.action}</Text>
              {/* Note Column with Truncation */}
              <Text className="flex-1 text-gray-600 text-center text-lg" numberOfLines={1}>
                {truncate(item.note, 20)}
              </Text>
              <Text className="flex-1 text-gray-600 text-center text-lg">{item.date}</Text>
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