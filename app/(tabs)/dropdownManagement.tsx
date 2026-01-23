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
} from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { paymentMethods, unitOfMeasurements } from "../../db/schema";
import { db } from "./_layout";

export default function DropdownManagement() {
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
    <View className="flex-1 bg-gray-100 p-4 gap-4 flex-row">
      {/* LEFT COLUMN: UNIT OF MEASUREMENTS */}
      <View className="flex-1">
        <UomSection data={uomData} onRefresh={loadData} />
      </View>

      {/* RIGHT COLUMN: PAYMENT METHODS */}
      <View className="flex-1">
        <PaymentSection data={paymentData} onRefresh={loadData} />
      </View>
    </View>
  );
}

// ============================================================================
// COMPONENT 1: Unit of Measurement Section
// ============================================================================
const UomSection = ({ data, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fields
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
        await db
          .update(unitOfMeasurements)
          .set({ unit, name })
          .where(eq(unitOfMeasurements.id, selectedItem.id));
      } else {
        await db.insert(unitOfMeasurements).values({ unit, name });
      }
      setModalVisible(false);
      onRefresh();
    } catch (error) {
      Alert.alert("Error", "Database error.");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
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
      <View className="bg-white p-3 rounded-lg border border-gray-200 gap-3 shadow-sm">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-800">
            Units of Measure
          </Text>
          <TouchableOpacity
            onPress={() => openModal()}
            className="flex-row items-center bg-primary px-3 py-2 rounded-md active:bg-blue-700"
          >
            <Plus size={18} color="white" />
            <Text className="text-white font-bold ml-1">Add</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center bg-gray-50 rounded-md px-3 border border-gray-200 h-12">
          <Search size={20} color="gray" />
          <TextInput
            placeholder="Search Units..."
            className="flex-1 ml-2 text-gray-700 h-full"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* LIST */}
      <View className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <View className="flex-row bg-gray-800 p-3">
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
              className={`flex-row items-center p-3 border-b border-gray-100 ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <Text className="flex-1 text-gray-800 font-bold">
                {item.unit}
              </Text>
              <Text className="flex-[2] text-gray-600">{item.name}</Text>
              <View className="w-10 items-end">
                <Edit2 size={16} color="#2563eb" />
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
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
              <Text className="text-xl font-bold text-gray-800">
                {selectedItem ? "Edit Unit" : "New Unit"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View className="gap-4">
              <View>
                <Text className="text-gray-700 font-bold mb-1">
                  Unit Symbol (e.g., kg) <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
              <View>
                <Text className="text-gray-700 font-bold mb-1">
                  Full Name (e.g., Kilograms) <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300"
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
const PaymentSection = ({ data, onRefresh }) => {
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
        await db
          .update(paymentMethods)
          .set({ name })
          .where(eq(paymentMethods.id, selectedItem.id));
      } else {
        await db.insert(paymentMethods).values({ name });
      }
      setModalVisible(false);
      onRefresh();
    } catch (error) {
      Alert.alert("Error", "Database error.");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
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
      <View className="bg-white p-3 rounded-lg border border-gray-200 gap-3 shadow-sm">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-800">
            Payment Methods
          </Text>
          <TouchableOpacity
            onPress={() => openModal()}
            className="flex-row items-center bg-primary px-3 py-2 rounded-md active:bg-blue-700"
          >
            <Plus size={18} color="white" />
            <Text className="text-white font-bold ml-1">Add</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center bg-gray-50 rounded-md px-3 border border-gray-200 h-12">
          <Search size={20} color="gray" />
          <TextInput
            placeholder="Search Methods..."
            className="flex-1 ml-2 text-gray-700 h-full"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* LIST */}
      <View className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <View className="flex-row bg-gray-800 p-3">
          <Text className="flex-1 font-bold text-white">Method Name</Text>
          <View className="w-10" />
        </View>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => openModal(item)}
              className={`flex-row items-center p-3 border-b border-gray-100 ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <Text className="flex-1 text-gray-800 font-medium">
                {item.name}
              </Text>
              <View className="w-10 items-end">
                <Edit2 size={16} color="#2563eb" />
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
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
              <Text className="text-xl font-bold text-gray-800">
                {selectedItem ? "Edit Method" : "New Method"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View className="gap-4">
              <View>
                <Text className="text-gray-700 font-bold mb-1">
                  Payment Method <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300"
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
    backgroundColor: "white",
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
