import { Stack } from "expo-router";
import { ActivityIndicator, Image, Text, View } from "react-native";
import './global.css';

// --- DATABASE IMPORTS ---
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';
import migrations from '../drizzle/migrations';

// 1. Initialize DB Instance & Export it
const expoDb = openDatabaseSync('db.db');
export const db = drizzle(expoDb);

export default function RootLayout() {
  // 2. Run Migrations
  const { success, error } = useMigrations(db, migrations);

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F2C94C" />
        <Text style={{ marginTop: 10 }}>Setting up Database...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>Migration Error: {error.message}</Text>
      </View>
    );
  }

  // 3. Navigation Stack
  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 10 }}>
            <Image
              source={require('../assets/images/icon.png')} 
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
            />
          </View>
        ),
      }}
    >
      {/* The Tabs Group */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      {/* Pages Outside Tabs */}
      <Stack.Screen
        name="newTransaction"
        options={{ title: 'New Transaction Item' }}
      />

      <Stack.Screen
        name="transactionSummary"
        options={{ title: 'Transaction Summary' }}
      />

      <Stack.Screen
        name="transactionDetailed"
        options={{ title: 'Detailed Transaction' }}
      />
    </Stack>
  );
}