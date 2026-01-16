import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import {
  ArrowRightLeft,
  Blocks,
  FileClock,
  LayoutDashboard,
  Package
} from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import "../global.css";

// --- DATABASE IMPORTS ---
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import migrations from '../../drizzle/migrations';
import { materials } from '../../db/schema'; // Ensure this matches your schema file path

// 1. Initialize DB Instance (Exported for use in other files)
const expoDb = openDatabaseSync('db.db');
export const db = drizzle(expoDb);

// 2. Custom Drawer Content (KEPT EXACTLY AS ORIGINAL)
function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.buttonsContainer}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/newTransaction')}>
          <Text style={styles.buttonText}>New Transaction</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/scanQR')}>
          <Text style={styles.buttonText}>Scan QR</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.separator} />
      <View style={styles.itemsContainer}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

// 3. The Main Layout
export default function Layout() {
  // --- DATABASE MIGRATION CHECK ---
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

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 10 }}>
            <Image
              source={require('../../assets/images/icon.png')} 
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
            />
          </View>
        ),
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => ( <LayoutDashboard size={size} color={color} /> ),
        }}
      />
      <Drawer.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          drawerIcon: ({ color, size }) => ( <ArrowRightLeft size={size} color={color} /> ),
        }}
      />
      <Drawer.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          drawerIcon: ({ color, size }) => ( <Package size={size} color={color} /> ),
        }}
      />
      <Drawer.Screen
        name="materials"
        options={{
          title: 'Materials',
          drawerIcon: ({ color, size }) => ( <Blocks size={size} color={color} /> ),
        }}
      />
      <Drawer.Screen
        name="auditTrails"
        options={{
          title: 'Audit Trails',
          drawerIcon: ({ color, size }) => ( <FileClock size={size} color={color} /> ),
        }}
      />
    </Drawer>
  );
}

// 4. Styles (KEPT EXACTLY AS ORIGINAL)
const styles = StyleSheet.create({
  buttonsContainer: { padding: 20, gap: 10 },
  sectionTitle: { fontSize: 12, color: '#888', marginBottom: 5, fontWeight: '600', textTransform: 'uppercase' },
  button: { backgroundColor: '#F2C94C', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  separator: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10, marginHorizontal: 20 },
  itemsContainer: { paddingTop: 10 }
});