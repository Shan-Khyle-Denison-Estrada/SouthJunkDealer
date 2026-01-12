import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import "./global.css"
import { Drawer } from 'expo-router/drawer';
import {
  ArrowRightLeft,
  FileClock,
  LayoutDashboard,
  Package
} from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. Create the Custom Drawer Content Component
function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      
      {/* --- Quick Access Buttons Section --- */}
      <View style={styles.buttonsContainer}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => console.log('New Transaction')}>
          <Text style={styles.buttonText}>New Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => console.log('Scan QR')}>
          <Text style={styles.buttonText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {/* --- Separator Line --- */}
      <View style={styles.separator} />

      {/* --- Standard Drawer Items (The Pages) --- */}
      <View style={styles.itemsContainer}>
        <DrawerItemList {...props} />
      </View>

    </DrawerContentScrollView>
  );
}

// 2. The Main Layout
export default function Layout() {
  return (
    <Drawer
      // Pass the custom component here
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          drawerIcon: ({ color, size }) => (
            <ArrowRightLeft size={size} color={color} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          drawerIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="auditTrails"
        options={{
          title: 'Audit Trails',
          drawerIcon: ({ color, size }) => (
            <FileClock size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

// 3. Styles
const styles = StyleSheet.create({
  buttonsContainer: {
    padding: 20,
    gap: 10, // Adds space between buttons
  },
  sectionTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: '#4F46E5', // Indigo color
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8, // Rounded corners
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Android shadow
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB', // Light grey line
    marginVertical: 10,
    marginHorizontal: 20,
  },
  itemsContainer: {
    paddingTop: 10,
  }
});