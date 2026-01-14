import { Stack } from "expo-router";
import { Image, View } from "react-native"; // Import UI components
import './global.css';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        // This places the content on the right side of the header
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 10 }}>
            {/* <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>
              South Junk Dealer
            </Text> */}
            <Image
              // REPLACE THIS with your actual logo path
              source={require('../assets/images/icon.png')} 
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
            />
          </View>
        ),
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="newTransaction"
        options={{ title: 'New Transaction' }}
      />

      <Stack.Screen
        name="scanQR"
        options={{ title: 'Scan QR Code' }}
      />

      <Stack.Screen
        name="transactionSummary"
        options={{ title: 'Transaction Summary' }}
      />

      <Stack.Screen
        name="inventoryDetailed"
        options={{ title: 'Inventory Batch' }}
      />

      <Stack.Screen
        name="editInventory"
        options={{ title: 'Edit Inventory' }}
      />
    </Stack>
  );
}