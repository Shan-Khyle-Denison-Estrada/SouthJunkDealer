import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 p-4 gap-4"> 
      {/* Added flex-1 to parent to ensure it fills the screen properly */}
      
      <View className="flex-1 w-full gap-4 flex-row"> 
        <View className="flex-1 bg-white w-full rounded-lg text-center justify-center items-center">
          <Text className="font-medium">Total Inventory Weight (Kg)</Text>
          <Text className="text-5xl font-bold">69,000</Text>
        </View>
        <View className="flex-1 bg-white w-full rounded-lg text-center justify-center items-center">
          <Text className="font-medium">Daily Profit (Php)</Text>
          <Text className="text-5xl font-bold">69,000</Text>
        </View>
        <View className="flex-1 bg-white w-full rounded-lg text-center justify-center items-center">
          <Text className="font-medium">Daily Revenue (Php)</Text>
          <Text className="text-5xl font-bold">69,000</Text>
        </View>
        <View className="flex-1 bg-white w-full rounded-lg text-center justify-center items-center">
          <Text className="font-medium">Daily Procurement Cost (Php)</Text>
          <Text className="text-5xl font-bold">69,000</Text>
        </View>
      </View>
      
      <View className="flex-[2] w-full flex-row gap-4">
        <View className="flex-1 bg-white w-full rounded-lg">

        </View>
        <View className="flex-1 bg-white w-full rounded-lg">

        </View>
      </View>

      <View className="flex-[3] bg-white w-full rounded-lg">

      </View>
      
    </View>
  );
}