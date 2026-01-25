import { Stack } from "expo-router";
import { ActivityIndicator, Image, Text, View } from "react-native";
import "./global.css";

// --- DATABASE IMPORTS ---
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "../db/client";
import migrations from "../drizzle/migrations";

// --- AUTH IMPORT ---
import { AuthProvider, useAuth } from "../context/AuthContext";

// 1. Inner Navigation Component (Consumes Auth)
function RootLayoutNav() {
  const { user, hasUsers, isLoading } = useAuth();

  // If AuthContext is still loading its initial state check
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#F2C94C" />
      </View>
    );
  }

  // 2. FIRST LAUNCH: No users exist? Force Registration.
  if (!hasUsers) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="register"
          options={{ headerShown: false, title: "System Setup" }}
        />
      </Stack>
    );
  }

  // 3. LOGGED OUT: Users exist but not signed in? Show Login.
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
    );
  }

  // 4. LOGGED IN: Show Main App
  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <View style={{ paddingRight: 10 }}>
            <Image
              source={require("../assets/images/icon.png")}
              style={{ width: 40, height: 40, resizeMode: "contain" }}
            />
          </View>
        ),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="newTransaction"
        options={{ title: "New Transaction Item" }}
      />
      <Stack.Screen
        name="transactionSummary"
        options={{ title: "Transaction Summary" }}
      />
      <Stack.Screen
        name="transactionDetailed"
        options={{ title: "Detailed Transaction" }}
      />
      <Stack.Screen
        name="inventoryDetailed"
        options={{ title: "Detailed Inventory" }}
      />
      <Stack.Screen
        name="editInventory"
        options={{ title: "Edit Inventory" }}
      />
      <Stack.Screen
        name="scannedInventory"
        options={{ title: "Inventory Check" }}
      />
      <Stack.Screen
        name="detailedAuditTrail"
        options={{ title: "Detailed Audit Trail" }}
      />
      <Stack.Screen name="forgotPassword" options={{ headerShown: false }} />
    </Stack>
  );
}

// 5. Main Layout Wrapper (Handles DB Initialization)
export default function RootLayout() {
  // MOVED MIGRATIONS HERE: Only render AuthProvider AFTER migrations succeed
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text>Migration Error: {error.message}</Text>
        <Text style={{ fontSize: 12, color: "#666", marginTop: 10 }}>
          Try deleting the app and reinstalling if this persists during
          development.
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#F2C94C" />
        <Text style={{ marginTop: 10 }}>Updating Database...</Text>
      </View>
    );
  }

  // Only now is it safe to initialize AuthProvider
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
