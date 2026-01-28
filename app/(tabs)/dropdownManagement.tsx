import { useFocusEffect } from "expo-router";
import { Edit2, Plus, Search, Trash2, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import {
  materials,
  paymentMethods,
  transactions,
  unitOfMeasurements,
} from "../../db/schema";

export default function DropdownManagement() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6",
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937",
    textSecondary: isDark ? "#A1A1AA" : "#4b5563",
    border: isDark ? "#333333" : "#e5e7eb",
    inputBg: isDark ? "#2C2C2C" : "#f3f4f6",
    inputText: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    headerBg: isDark ? "#0f0f0f" : "#1f2937",
    primary: "#2563eb",
  };

  const [uomData, setUomData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const uoms = await db.select().from(unitOfMeasurements);
      const payments = await db.select().from(paymentMethods);
      setUomData(uoms);
      setPaymentData(payments);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  return (
    <View
      className="flex-1 p-4 gap-4 flex-row"
      style={{ backgroundColor: theme.background }}
    >
      {/* LEFT COLUMN: UNIT OF MEASUREMENTS */}
      <View className="flex-1">
        <UomSection data={uomData} onRefresh={loadData} theme={theme} />
      </View>

      {/* RIGHT COLUMN: PAYMENT METHODS */}
      <View className="flex-1">
        <PaymentSection data={paymentData} onRefresh={loadData} theme={theme} />
      </View>
    </View>
  );
}

// ============================================================================
// COMPONENT 1: Unit of Measurement Section
// ============================================================================
const UomSection = ({ data, onRefresh, theme }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [unit, setUnit] = useState("");
  const [name, setName] = useState("");

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openModal = (item = null) => {
    setSelectedItem(item);
    if (item) {
      setUnit(item.unit);
      setName(item.name);
    } else {
      setUnit("");
      setName("");
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!unit || !name) {
      Alert.alert("Error", "Both Unit and Name are required.");
      return;
    }
    try {
      if (selectedItem) {
        // --- UPDATE LOGIC WITH CASCADE ---
        // 1. Update the definition
        await db
          .update(unitOfMeasurements)
          .set({ unit, name })
          .where(eq(unitOfMeasurements.id, selectedItem.id));

        // 2. Cascade Update: If the symbol changed, update all materials using the old symbol
        if (selectedItem.unit !== unit) {
          await db
            .update(materials)
            .set({ uom: unit })
            .where(eq(materials.uom, selectedItem.unit));
        }
      } else {
        await db.insert(unitOfMeasurements).values({ unit, name });
      }
      setModalVisible(false);
      onRefresh();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Database error.");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    // --- CHECK CONSTRAINT BEFORE DELETE ---
    const associatedMaterials = await db
      .select()
      .from(materials)
      .where(eq(materials.uom, selectedItem.unit));

    if (associatedMaterials.length > 0) {
      Alert.alert(
        "Action Prohibited",
        `Cannot delete "${selectedItem.unit}". It is currently used by ${associatedMaterials.length} material(s).`,
      );
      return;
    }

    Alert.alert("Confirm Delete", `Delete "${selectedItem.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await db
            .delete(unitOfMeasurements)
            .where(eq(unitOfMeasurements.id, selectedItem.id));
          setModalVisible(false);
          onRefresh();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 gap-4">
      {/* HEADER */}
      <View
        className="p-3 rounded-lg border gap-3 shadow-sm"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        <View className="flex-row justify-between items-center">
          <Text
            className="text-xl font-bold"
            style={{ color: theme.textPrimary }}
          >
            Units of Measure
          </Text>
          <TouchableOpacity
            onPress={() => openModal()}
            className="flex-row items-center px-3 py-2 rounded-md active:opacity-80"
            style={{ backgroundColor: "#F2C94C" }}
          >
            <Plus size={18} color="white" />
            <Text className="text-white font-bold ml-1">Add</Text>
          </TouchableOpacity>
        </View>
        <View
          className="flex-row items-center rounded-md px-3 border h-12"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
          }}
        >
          <Search size={20} color={theme.placeholder} />
          <TextInput
            placeholder="Search Units..."
            placeholderTextColor={theme.placeholder}
            className="flex-1 ml-2 h-full"
            style={{ color: theme.inputText }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* LIST */}
      <View
        className="flex-1 rounded-lg overflow-hidden border shadow-sm"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        <View
          className="flex-row p-3"
          style={{ backgroundColor: theme.headerBg }}
        >
          <Text className="flex-1 font-bold text-white">Symbol</Text>
          <Text className="flex-[2] font-bold text-white">Full Name</Text>
          <View className="w-10" />
        </View>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => openModal(item)}
              className="flex-row items-center p-3 border-b"
              style={{
                backgroundColor: index % 2 === 0 ? theme.rowEven : theme.rowOdd,
                borderColor: theme.border,
              }}
            >
              <Text
                className="flex-1 font-bold"
                style={{ color: theme.textPrimary }}
              >
                {item.unit}
              </Text>
              <Text className="flex-[2]" style={{ color: theme.textSecondary }}>
                {item.name}
              </Text>
              <View className="w-10 items-end">
                <Edit2 size={16} color={theme.primary} />
              </View>
            </Pressable>
          )}
        />
      </View>

      {/* MODAL */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <View
              className="flex-row justify-between items-center mb-4 border-b pb-2"
              style={{ borderBottomColor: theme.border }}
            >
              <Text
                className="text-xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                {selectedItem ? "Edit Unit" : "New Unit"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <View className="gap-4">
              <View>
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textSecondary }}
                >
                  Unit Symbol (e.g., kg) <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="rounded-md px-3 h-12 border"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.inputText,
                  }}
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
              <View>
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textSecondary }}
                >
                  Full Name (e.g., Kilograms){" "}
                  <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="rounded-md px-3 h-12 border"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.inputText,
                  }}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
            <View className="mt-6 flex-row gap-3">
              {selectedItem && (
                <TouchableOpacity
                  onPress={handleDelete}
                  className="flex-1 bg-red-600 p-3 rounded-md items-center"
                >
                  <Trash2 size={20} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 bg-green-600 p-3 rounded-md items-center"
              >
                <Text className="font-bold text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// ============================================================================
// COMPONENT 2: Payment Method Section
// ============================================================================
const PaymentSection = ({ data, onRefresh, theme }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [name, setName] = useState("");

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openModal = (item = null) => {
    setSelectedItem(item);
    setName(item ? item.name : "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name) return Alert.alert("Error", "Name is required.");
    try {
      if (selectedItem) {
        // --- UPDATE LOGIC WITH CASCADE ---
        // 1. Update the definition
        await db
          .update(paymentMethods)
          .set({ name })
          .where(eq(paymentMethods.id, selectedItem.id));

        // 2. Cascade Update: Update all transactions using the old payment name
        if (selectedItem.name !== name) {
          await db
            .update(transactions)
            .set({ paymentMethod: name })
            .where(eq(transactions.paymentMethod, selectedItem.name));
        }
      } else {
        await db.insert(paymentMethods).values({ name });
      }
      setModalVisible(false);
      onRefresh();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Database error.");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    // --- CHECK CONSTRAINT BEFORE DELETE ---
    const associatedTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.paymentMethod, selectedItem.name));

    if (associatedTransactions.length > 0) {
      Alert.alert(
        "Action Prohibited",
        `Cannot delete "${selectedItem.name}". It is currently used in ${associatedTransactions.length} transaction(s).`,
      );
      return;
    }

    Alert.alert("Confirm Delete", `Delete "${selectedItem.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await db
            .delete(paymentMethods)
            .where(eq(paymentMethods.id, selectedItem.id));
          setModalVisible(false);
          onRefresh();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 gap-4">
      {/* HEADER */}
      <View
        className="p-3 rounded-lg border gap-3 shadow-sm"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        <View className="flex-row justify-between items-center">
          <Text
            className="text-xl font-bold"
            style={{ color: theme.textPrimary }}
          >
            Payment Methods
          </Text>
          <TouchableOpacity
            onPress={() => openModal()}
            className="flex-row items-center px-3 py-2 rounded-md active:opacity-80"
            style={{ backgroundColor: "#F2C94C" }}
          >
            <Plus size={18} color="white" />
            <Text className="text-white font-bold ml-1">Add</Text>
          </TouchableOpacity>
        </View>
        <View
          className="flex-row items-center rounded-md px-3 border h-12"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
          }}
        >
          <Search size={20} color={theme.placeholder} />
          <TextInput
            placeholder="Search Methods..."
            placeholderTextColor={theme.placeholder}
            className="flex-1 ml-2 h-full"
            style={{ color: theme.inputText }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* LIST */}
      <View
        className="flex-1 rounded-lg overflow-hidden border shadow-sm"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        <View
          className="flex-row p-3"
          style={{ backgroundColor: theme.headerBg }}
        >
          <Text className="flex-1 font-bold text-white">Method Name</Text>
          <View className="w-10" />
        </View>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => openModal(item)}
              className="flex-row items-center p-3 border-b"
              style={{
                backgroundColor: index % 2 === 0 ? theme.rowEven : theme.rowOdd,
                borderColor: theme.border,
              }}
            >
              <Text
                className="flex-1 font-medium"
                style={{ color: theme.textPrimary }}
              >
                {item.name}
              </Text>
              <View className="w-10 items-end">
                <Edit2 size={16} color={theme.primary} />
              </View>
            </Pressable>
          )}
        />
      </View>

      {/* MODAL */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <View
              className="flex-row justify-between items-center mb-4 border-b pb-2"
              style={{ borderBottomColor: theme.border }}
            >
              <Text
                className="text-xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                {selectedItem ? "Edit Method" : "New Method"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <View className="gap-4">
              <View>
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textSecondary }}
                >
                  Payment Method <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="rounded-md px-3 h-12 border"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.inputText,
                  }}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
            <View className="mt-6 flex-row gap-3">
              {selectedItem && (
                <TouchableOpacity
                  onPress={handleDelete}
                  className="flex-1 bg-red-600 p-3 rounded-md items-center"
                >
                  <Trash2 size={20} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 bg-green-600 p-3 rounded-md items-center"
              >
                <Text className="font-bold text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: 350,
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
