import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import {
  ArrowRightLeft,
  Blocks,
  CalendarDays,
  FileClock,
  LayoutDashboard,
  Package,
  Plus,
  QrCode,
  Settings,
  User,
} from "lucide-react-native";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function TabLayout() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#ffffff",
    drawerActiveBg: isDark ? "#1E1E1E" : "#f2f2f2",
    drawerActiveText: isDark ? "#F2C94C" : "#000000",
    drawerInactiveText: isDark ? "#A1A1AA" : "#666666",
    separator: isDark ? "#333333" : "#f0f0f0",
    sectionTitle: isDark ? "#888888" : "#888888",
    primary: "#F2C94C",
    buttonText: "#ffffff",
  };

  // --- CUSTOM DRAWER COMPONENT ---
  function CustomDrawerContent(props: any) {
    return (
      <DrawerContentScrollView
        {...props}
        style={{ backgroundColor: theme.background }}
      >
        {/* 1. Quick Access Section */}
        <View
          style={[
            styles.buttonsContainer,
            { borderBottomColor: theme.separator },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>
            Quick Access
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/transactionSummary")}
          >
            <View style={styles.buttonContent}>
              <Plus size={18} color="#ffffff" />
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                New Transaction
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { marginTop: 8, backgroundColor: theme.primary },
            ]}
            onPress={() => router.push("/scanQR")}
          >
            <View style={styles.buttonContent}>
              <QrCode size={18} color="#ffffff" />
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                Scan QR Code
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Standard Drawer Items */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          // Header Styles (Colors Only)
          headerStyle: {
            backgroundColor: theme.background,
            borderBottomColor: theme.separator,
            borderBottomWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: isDark ? "#FFFFFF" : "#000000",
          headerTitleStyle: { fontWeight: "bold" },

          // --- LOGO RESTORED HERE ---
          headerRight: () => (
            <Image
              source={require("../../assets/images/icon.png")}
              style={{
                width: 40,
                height: 40,
                marginRight: 15,
                resizeMode: "contain",
              }}
            />
          ),

          // Drawer Styles (Colors Only - No Width/Margin changes)
          drawerStyle: {
            backgroundColor: theme.background,
          },
          drawerActiveBackgroundColor: theme.drawerActiveBg,
          drawerActiveTintColor: theme.drawerActiveText,
          drawerInactiveTintColor: theme.drawerInactiveText,
          // Removed drawerLabelStyle to keep original spacing
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
          name="bookings"
          options={{
            drawerLabel: "Bookings",
            title: "Bookings",
            drawerIcon: ({ color }) => <CalendarDays color={color} size={24} />,
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 14,
  },
});
