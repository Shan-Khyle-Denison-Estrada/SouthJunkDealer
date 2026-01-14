import { Stack } from "expo-router";
import './global.css';

export default function RootLayout() {
  return (
    <Stack>
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
    </Stack>
  );
}