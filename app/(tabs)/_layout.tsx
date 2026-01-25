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
  Plus,
  QrCode,
  Settings,
  User,
} from "lucide-react-native";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// --- CUSTOM DRAWER COMPONENT ---
function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      {/* 1. Quick Access Section */}
      <View style={styles.buttonsContainer}>
        <Text style={styles.sectionTitle}>Quick Access</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/transactionSummary")} // Adjust route if needed
        >
          <View style={styles.buttonContent}>
            <Plus size={18} color="#ffffff" />
            <Text style={styles.buttonText}>New Transaction</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { marginTop: 8 }]}
          onPress={() => router.push("/scanQR")} // Ensure you have a 'scan.tsx' route or adjust this
        >
          <View style={styles.buttonContent}>
            <QrCode size={18} color="#ffffff" />
            <Text style={styles.buttonText}>Scan QR Code</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Standard Drawer Items (Dashboard, Inventory, etc.) */}
      <View style={{ marginTop: 10 }}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerActiveTintColor: "#F2C94C",
          drawerType: "slide",
          headerShown: true,
          // HEADER LOGO (Right Side)
          headerRight: () => (
            <View style={{ paddingRight: 15 }}>
              <Image
                source={require("../../assets/images/icon.png")}
                style={{ width: 60, height: 60, resizeMode: "contain" }}
              />
            </View>
          ),
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: "Dashboard",
            title: "Dashboard",
            drawerIcon: ({ color }) => (
              <LayoutDashboard color={color} size={24} />
            ),
          }}
        />
        <Drawer.Screen
          name="transactions"
          options={{
            drawerLabel: "Transactions",
            title: "Transactions",
            drawerIcon: ({ color }) => (
              <ArrowRightLeft color={color} size={24} />
            ),
          }}
        />
        <Drawer.Screen
          name="inventory"
          options={{
            drawerLabel: "Inventory",
            title: "Inventory",
            drawerIcon: ({ color }) => <Package color={color} size={24} />,
          }}
        />
        <Drawer.Screen
          name="materials"
          options={{
            drawerLabel: "Materials",
            title: "Materials",
            drawerIcon: ({ color }) => <Blocks color={color} size={24} />,
          }}
        />
        <Drawer.Screen
          name="auditTrails"
          options={{
            drawerLabel: "Audit Trails",
            title: "Audit Trails",
            drawerIcon: ({ color }) => <FileClock color={color} size={24} />,
          }}
        />
        <Drawer.Screen
          name="dropdownManagement"
          options={{
            drawerLabel: "Dropdown Settings",
            title: "Dropdown Settings",
            drawerIcon: ({ color }) => <Settings color={color} size={24} />,
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: "Admin Account",
            title: "Admin Account",
            drawerIcon: ({ color }) => <User color={color} size={24} />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  button: {
    backgroundColor: "#F2C94C",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
