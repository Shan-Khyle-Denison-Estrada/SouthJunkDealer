import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

export default function AuditIndex() {
  // Dummy data for Audit Trails
  // Context: Logs tracking Who (User), What (Activity), and When (Timestamp)
  const auditData = [
    { id: "LOG-001", user: "Admin", action: "Created Material: Steel Beams", type: "create", time: "2023-10-27 14:30" },
    { id: "LOG-002", user: "John Doe", action: "Updated Stock: Cement (M-102)", type: "update", time: "2023-10-27 12:15" },
    { id: "LOG-003", user: "Jane Smith", action: "Deleted Item: Old Wiring", type: "delete", time: "2023-10-26 09:00" },
    { id: "LOG-004", user: "System", action: "Auto-Backup Completed", type: "system", time: "2023-10-26 02:00" },
    { id: "LOG-005", user: "Admin", action: "User Login: Supervisor", type: "access", time: "2023-10-25 08:45" },
    { id: "LOG-006", user: "John Doe", action: "Exported Monthly Report", type: "export", time: "2023-10-25 16:20" },
  ];

  // Helper to determine text color based on action type
  const getActionColor = (type: string) => {
    switch (type) {
      case 'create': return 'text-green-600';
      case 'delete': return 'text-red-600';
      case 'update': return 'text-blue-600';
      default: return 'text-gray-800';
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* 1. TOP VIEW: Search and Export Button */}
      <View className="flex-[1] flex-row items-center justify-between">
        {/* Search Bar: Width 3/8 (37.5%) */}
        <View className="w-[37.5%] h-full flex-row items-center bg-white rounded-md px-3 py-2">
          <Search size={20} color="gray" />
          <TextInput 
            placeholder="Search Audit Trail" 
            className="flex-1 ml-2 text-base text-gray-700"
          />
        </View>

        
        <Pressable className="w-[25%] h-full flex-row items-center justify-center bg-primary rounded-md py-2 active:bg-gray-900" onPress={() => router.push('/scannedInventory')}>
          <Plus size={20} color="white" />
          <Text className="text-white font-medium ml-2">Inventory Check</Text>
        </Pressable>
      </View>

      {/* 2. MIDDLE VIEW: Non-scrollable Table */}
      <View className="flex-[12] bg-white rounded-lg overflow-hidden">
        {/* Table Header */}
        <View className="flex-row bg-gray-200 p-4 border-b border-gray-300">
          <Text className="flex-1 font-bold text-gray-700">User</Text>
          <Text className="flex-[2] font-bold text-gray-700">Activity</Text>
          <Text className="flex-1 font-bold text-right text-gray-700">Timestamp</Text>
        </View>

        {/* Table Body */}
        <View className="flex-1">
          {auditData.map((item, index) => (
            <Pressable 
              key={index} 
              className="flex-1 flex-row items-center p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-50"
            >
              {/* User Column */}
              <View className="flex-1 flex-row items-center">
                 {/* Optional: Small circle avatar indicator */}
                <View className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                <Text className="text-gray-800 font-medium">{item.user}</Text>
              </View>
              
              {/* Activity Column (Wider flex-2) */}
              <Text className={`flex-[2] font-medium ${getActionColor(item.type)}`}>
                {item.action}
              </Text>
              
              {/* Time Column */}
              <Text className="flex-1 text-right text-gray-500 text-xs">
                {item.time}
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