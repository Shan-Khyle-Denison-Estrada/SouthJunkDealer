import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  View,
  useColorScheme,
} from "react-native";
import "./global.css";

// --- DATABASE IMPORTS ---
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "../db/client";
import migrations from "../drizzle/migrations";

// --- AUTH IMPORT ---
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutNav() {
  const { user, hasUsers, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#ffffff",
    headerBg: isDark ? "#121212" : "#ffffff",
    headerTint: isDark ? "#FFFFFF" : "#000000",
    text: isDark ? "#FFFFFF" : "#000000",
    primary: "#F2C94C",
  };

  useEffect(() => {
    if (isLoading) return;

    // Logic: Identify where the user is trying to go
    const inAuthGroup =
      segments[0] === "(auth)" ||
      segments.includes("login") ||
      segments.includes("register");
    const isRegister = segments.includes("register");
    const isLogin = segments.includes("login");

    console.log(
      `[Nav Guard] hasUsers: ${hasUsers}, user: ${user?.email}, segment: ${segments}`,
    );

    // CASE 1: No users exist? Force them to Register.
    if (hasUsers === false) {
      if (!isRegister) {
        router.replace("/register");
      }
    }
    // CASE 2: Users exist, but not logged in? Force Login.
    else if (!user) {
      if (!isLogin) {
        router.replace("/login");
      }
    }
    // CASE 3: Logged in, but trying to access Auth screens? Send to Dashboard.
    else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, hasUsers, isLoading, segments]);

  // Loading State
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // RETURN ONE SINGLE STACK (The Navigation Guard handles where they go)
  return (
    <Stack
      screenOptions={{
        // 1. Dynamic Header Background
        headerStyle: { backgroundColor: theme.headerBg },
        // 2. Dynamic Header Text/Icon Color
        headerTintColor: theme.headerTint,
        // 3. Dynamic Screen Body Background
        contentStyle: { backgroundColor: theme.background },
        headerRight: () =>
          // Only show icon if logged in (user exists)
          user ? (
            <View style={{ paddingRight: 10 }}>
              <Image
                source={require("../assets/images/icon.png")}
                style={{ width: 40, height: 40, resizeMode: "contain" }}
              />
            </View>
          ) : null,
      }}
    >
      {/* Main App */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Auth Screens (Hidden Headers) */}
      <Stack.Screen
        name="register"
        options={{ headerShown: false, title: "Setup" }}
      />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="forgotPassword" options={{ headerShown: false }} />

      {/* Transaction Screens */}
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
    </Stack>
  );
}

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // Simple Theme for Wrapper Screens (Migration/Loading)
  const wrapperTheme = {
    background: isDark ? "#121212" : "#ffffff",
    text: isDark ? "#FFFFFF" : "#000000",
    subText: isDark ? "#AAAAAA" : "#666666",
  };

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          backgroundColor: wrapperTheme.background,
        }}
      >
        <Text style={{ color: wrapperTheme.text }}>
          Migration Error: {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: wrapperTheme.background,
        }}
      >
        <ActivityIndicator size="large" color="#F2C94C" />
        <Text style={{ marginTop: 10, color: wrapperTheme.text }}>
          Updating Database...
        </Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
