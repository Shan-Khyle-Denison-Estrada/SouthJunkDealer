import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import {
  ArrowRightLeft,
  Blocks,
  FileClock,
  LayoutDashboard,
  Package,
  Settings, // <--- NEW IMPORT
} from "lucide-react-native";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "../global.css";

// --- DATABASE IMPORTS ---
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite";
import migrations from "../../drizzle/migrations";

// 1. Initialize DB Instance
const expoDb = openDatabaseSync("db.db");
export const db = drizzle(expoDb);

// 2. Custom Drawer Content
function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.buttonsContainer}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/transactionSummary")}
        >
          <Text style={styles.buttonText}>New Transaction</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/scanQR")}
        >
          <Text style={styles.buttonText}>Scan QR</Text>
        </TouchableOpacity>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function Layout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Migration Error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#F2C94C" />
      </View>
    );
  }

  return (
    <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen
        name="index"
        options={{
          title: "Dashboard",
          drawerIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="transactions"
        options={{
          title: "Transactions",
          drawerIcon: ({ color, size }) => (
            <ArrowRightLeft size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="inventory"
        options={{
          title: "Inventory",
          drawerIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="materials"
        options={{
          title: "Materials",
          drawerIcon: ({ color, size }) => <Blocks size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="auditTrails"
        options={{
          title: "Audit Trails",
          drawerIcon: ({ color, size }) => (
            <FileClock size={size} color={color} />
          ),
        }}
      />
      {/* --- NEW DRAWER ITEM --- */}
      <Drawer.Screen
        name="dropdownManagement"
        options={{
          title: "Manage Dropdowns",
          drawerIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: { padding: 20, gap: 10 },
  sectionTitle: {
    fontSize: 12,
    color: "#888",
    marginBottom: 5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  button: {
    backgroundColor: "#F2C94C",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: "#ffffff", fontWeight: "bold", fontSize: 14 },
});
