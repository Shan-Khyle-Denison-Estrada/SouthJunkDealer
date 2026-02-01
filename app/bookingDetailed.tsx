import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
    ArrowLeft,
    Camera,
    Check,
    ChevronDown,
    Mail,
    MapPin,
    Phone,
    Plus,
    Trash2,
    X
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import {
    materials,
    paymentMethods,
    transactionItems,
    transactions,
} from "../db/schema";

// --- UTILS ---
const getRandomColor = (name) => {
  const colors = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatCurrency = (amount) => {
  return (
    "₱" +
    (amount || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

// --- CUSTOM COMPONENTS ---
const CustomPicker = ({
  selectedValue,
  onValueChange,
  placeholder,
  items,
  theme,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedItem = items.find((i) => i.value === selectedValue);
  const displayLabel = selectedItem ? selectedItem.label : placeholder;

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[
          styles.pickerTrigger,
          { backgroundColor: theme.inputBg, borderColor: theme.border },
        ]}
      >
        <Text
          style={[
            styles.pickerText,
            { color: selectedValue ? theme.textPrimary : theme.placeholder },
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <ChevronDown size={16} color={theme.textSecondary} />
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.pickerOptionsContainer,
              { backgroundColor: theme.card },
            ]}
          >
            <View
              style={[styles.pickerHeader, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.pickerTitle, { color: theme.textPrimary }]}>
                {placeholder}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: theme.subtleBorder },
                    selectedValue === item.value && {
                      backgroundColor: theme.highlightBg,
                    },
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      { color: theme.textSecondary },
                      selectedValue === item.value && {
                        color: theme.primary,
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Check size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default function BookingDetailed() {
  const params = useLocalSearchParams();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6",
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937",
    textSecondary: isDark ? "#A1A1AA" : "#6b7280",
    placeholder: isDark ? "#6b7280" : "#9ca3af",
    border: isDark ? "#333333" : "#e5e7eb",
    subtleBorder: isDark ? "#2C2C2C" : "#f9fafb",
    inputBg: isDark ? "#2C2C2C" : "#ffffff",
    highlightBg: isDark ? "#1e3a8a" : "#eff6ff",
    headerBg: isDark ? "#0f0f0f" : "#f9fafb",
    primary: "#2563eb",
    danger: "#ef4444",
    success: "#10b981",
  };

  const transactionId = params.bookingId ? Number(params.bookingId) : null;

  // Data State
  const [lineItems, setLineItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  // Header State
  const [transactionType, setTransactionType] = useState("Buying");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAffiliation, setClientAffiliation] = useState("");
  const [driverName, setDriverName] = useState("");
  const [truckPlate, setTruckPlate] = useState("");
  const [truckWeight, setTruckWeight] = useState("");
  const [status, setStatus] = useState("Pending");

  // Modals & Inputs
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [paidAmountInput, setPaidAmountInput] = useState("");

  // Edit Item State
  const [materialsList, setMaterialsList] = useState([]);
  const [paymentMethodList, setPaymentMethodList] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);

  const [newItemMaterialId, setNewItemMaterialId] = useState(null);
  const [newItemWeight, setNewItemWeight] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemSubtotal, setNewItemSubtotal] = useState("0.00");

  // --- LOADERS ---
  const loadMaterials = async () => {
    const data = await db.select().from(materials);
    setMaterialsList(
      data.map((m) => ({ label: m.name, value: m.id, uom: m.uom })),
    );
  };

  const loadPaymentMethods = async () => {
    try {
      const data = await db.select().from(paymentMethods);
      setPaymentMethodList(
        data.map((pm) => ({ label: pm.name, value: pm.name })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const loadTransactionData = async () => {
    if (transactionId) {
      const txHeader = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));
      if (txHeader.length > 0) {
        const h = txHeader[0];
        setTransactionType(h.type || "Buying");
        setPaymentMethod(h.paymentMethod);
        setClientName(h.clientName || "");
        setClientAffiliation(h.clientAffiliation || "");
        setDriverName(h.driverName || "");
        setTruckPlate(h.truckPlate || "");
        setTruckWeight(h.truckWeight ? String(h.truckWeight) : "");
        setStatus(h.status || "Pending");
      }
      const items = await db
        .select({
          id: transactionItems.id,
          material: materials.name,
          materialId: materials.id,
          weight: transactionItems.weight,
          price: transactionItems.price,
          subtotal: transactionItems.subtotal,
          uom: materials.uom,
        })
        .from(transactionItems)
        .leftJoin(materials, eq(transactionItems.materialId, materials.id))
        .where(eq(transactionItems.transactionId, transactionId));

      setLineItems(items);
      setGrandTotal(items.reduce((sum, item) => sum + item.subtotal, 0));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMaterials();
      loadPaymentMethods();
      loadTransactionData();
    }, [transactionId]),
  );

  useEffect(() => {
    const w = parseFloat(newItemWeight) || 0;
    const p = parseFloat(newItemPrice) || 0;
    setNewItemSubtotal((w * p).toFixed(2));
  }, [newItemWeight, newItemPrice]);

  // --- HANDLERS ---
  const handleAddItem = () => {
    setEditingItemId(null);
    setNewItemMaterialId(null);
    setNewItemWeight("");
    setNewItemPrice("");
    setNewItemSubtotal("0.00");
    setAddItemModalVisible(true);
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setNewItemMaterialId(item.materialId);
    setNewItemWeight(String(item.weight));
    setNewItemPrice(String(item.price));
    setNewItemSubtotal(String(item.subtotal));
    setAddItemModalVisible(true);
  };

  const saveItem = async () => {
    if (!newItemMaterialId || !newItemWeight || !newItemPrice) return;
    const w = parseFloat(newItemWeight);
    const p = parseFloat(newItemPrice);
    const sub = w * p;

    if (transactionId) {
      if (editingItemId) {
        await db
          .update(transactionItems)
          .set({
            materialId: newItemMaterialId,
            weight: w,
            price: p,
            subtotal: sub,
          })
          .where(eq(transactionItems.id, editingItemId));
      } else {
        await db
          .insert(transactionItems)
          .values({
            transactionId,
            materialId: newItemMaterialId,
            weight: w,
            price: p,
            subtotal: sub,
          });
      }
      loadTransactionData();
    }
    setAddItemModalVisible(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (transactionId) {
      await db.delete(transactionItems).where(eq(transactionItems.id, itemId));
      loadTransactionData();
    }
  };

  const confirmFinish = async () => {
    try {
      if (transactionId) {
        await db
          .update(transactions)
          .set({
            paidAmount: parseFloat(paidAmountInput) || 0,
            status: "Completed",
            totalAmount: grandTotal,
          })
          .where(eq(transactions.id, transactionId));

        Alert.alert("Success", "Transaction completed successfully!");
        setFinishModalVisible(false);
        router.back();
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // --- MOCK CAMERA ACTIONS ---
  const handleCaptureScrap = () =>
    Alert.alert("Camera", "Opening camera for scrap evidence...");
  const handleCaptureLicense = () =>
    Alert.alert("Camera", "Opening camera for driver license...");

  // --- UI CONSTANTS ---
  const clientInitials = clientName
    ? clientName.substring(0, 2).toUpperCase()
    : "NA";
  const clientBgColor = getRandomColor(clientName);

  return (
    <View
      className="flex-1 flex-row"
      style={{ backgroundColor: theme.background }}
    >
      {/* ======================= */}
      {/* SIDEBAR: CLIENT PROFILE */}
      {/* ======================= */}
      <View
        className="w-80 border-r flex-col z-20 flex-shrink-0"
        style={{ backgroundColor: theme.card, borderColor: theme.border }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            alignItems: "center",
            flexGrow: 1,
          }}
        >

          {/* Avatar */}
          <View className="relative mb-4">
            <View
              className="w-24 h-24 rounded-full items-center justify-center shadow-sm"
              style={{ backgroundColor: clientBgColor }}
            >
              <Text className="text-3xl font-bold text-white tracking-widest">
                {clientInitials}
              </Text>
            </View>
          </View>

          <Text
            className="text-xl font-bold text-center mb-1"
            style={{ color: theme.textPrimary }}
          >
            {clientName || "Unknown Client"}
          </Text>

          <View className="flex-row items-center gap-2 mb-8">
            <View className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
              <Text
                className="text-[10px] font-bold uppercase"
                style={{ color: theme.textSecondary }}
              >
                {transactionId
                  ? `ID: #${String(transactionId).padStart(4, "0")}`
                  : "NEW"}
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900">
              <Text className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">
                {clientAffiliation || "N/A"}
              </Text>
            </View>
          </View>

          {/* Contact Info */}
          <View className="w-full gap-5">
            <View className="flex-row gap-3 items-start">
              <View className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                <Phone size={16} color={theme.textSecondary} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
                  Phone Number
                </Text>
                <Text
                  className="text-sm font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  +63 917 123 4567
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3 items-start">
              <View className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                <Mail size={16} color={theme.textSecondary} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
                  Email Address
                </Text>
                <Text
                  className="text-sm font-medium"
                  style={{ color: theme.textPrimary }}
                  numberOfLines={1}
                >
                  {clientName
                    ? `${clientName.replace(/\s/g, ".").toLowerCase()}@gmail.com`
                    : "N/A"}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3 items-start">
              <View className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                <MapPin size={16} color={theme.textSecondary} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
                  Location
                </Text>
                <Text
                  className="text-sm font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  Zamboanga City, PH
                </Text>
              </View>
            </View>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Highlighted Status Badge */}
          <View
            className="w-full p-4 rounded-xl border shadow-sm items-center justify-center mt-6"
            style={{
              backgroundColor:
                status === "Completed"
                  ? isDark
                    ? "#064e3b"
                    : "#ecfdf5"
                  : isDark
                    ? "#172554"
                    : "#eff6ff",
              borderColor:
                status === "Completed"
                  ? isDark
                    ? "#059669"
                    : "#6ee7b7"
                  : isDark
                    ? "#2563eb"
                    : "#93c5fd",
            }}
          >
            <Text
              className="text-xs font-black uppercase tracking-widest mb-1 opacity-70"
              style={{
                color:
                  status === "Completed"
                    ? isDark
                      ? "#a7f3d0"
                      : "#065f46"
                    : isDark
                      ? "#bfdbfe"
                      : "#1e40af",
              }}
            >
              Booking Status
            </Text>
            <Text
              className="text-lg font-bold"
              style={{
                color:
                  status === "Completed"
                    ? isDark
                      ? "#ffffff"
                      : "#047857"
                    : isDark
                      ? "#ffffff"
                      : "#1d4ed8",
              }}
            >
              {status}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* ================================= */}
      {/* MAIN AREA: TRANSACTION WORKSPACE  */}
      {/* ================================= */}
      <View className="flex-1 flex-col p-6 gap-4" style={{ minWidth: 350 }}>
        {/* 1. HEADER CARD (INFO) */}
        <View
          className="rounded-lg border bg-card p-4"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          {/* ROW 1: Type & Payment */}
          <View className="flex-row gap-6 mb-2">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Transaction Type
              </Text>
              <View className="h-10">
                <CustomPicker
                  selectedValue={transactionType}
                  onValueChange={setTransactionType}
                  placeholder="Select Type"
                  items={[
                    { label: "Buying (In)", value: "Buying" },
                    { label: "Selling (Out)", value: "Selling" },
                  ]}
                  theme={theme}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Payment Method
              </Text>
              <View className="h-10">
                <CustomPicker
                  selectedValue={paymentMethod}
                  onValueChange={setPaymentMethod}
                  placeholder="Select Method"
                  items={paymentMethodList}
                  theme={theme}
                />
              </View>
            </View>
          </View>

          {/* ROW 2: Logistics (Conditional) */}
          {transactionType === "Selling" && (
            <View
              className="mt-4 pt-4 border-t flex-row gap-4 items-end"
              style={{ borderColor: theme.border }}
            >
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Driver Name
                </Text>
                <TextInput
                  value={driverName}
                  onChangeText={setDriverName}
                  className="h-10 px-3 rounded border text-sm"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  }}
                  placeholder="Enter Name"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Plate Number
                </Text>
                <TextInput
                  value={truckPlate}
                  onChangeText={setTruckPlate}
                  className="h-10 px-3 rounded border text-sm"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  }}
                  placeholder="ABC-123"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
              <View className="w-24">
                <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Weight
                </Text>
                <TextInput
                  value={truckWeight}
                  onChangeText={setTruckWeight}
                  className="h-10 px-3 rounded border text-sm"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  }}
                  placeholder="0"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              {/* DRIVER LICENSE CAMERA BUTTON */}
              <TouchableOpacity
                onPress={handleCaptureLicense}
                className="h-10 px-3 flex-row items-center gap-2 rounded border bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                style={{ borderColor: theme.border }}
              >
                <Camera size={16} color={theme.textSecondary} />
                <Text
                  className="text-[10px] font-bold uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  License
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 2. TABLE CARD (Occupies remaining vertical space) */}
        <View
          className="flex-1 rounded-lg border overflow-hidden"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          {/* TABLE HEADER: Title + Buttons (Wrapped for resiliency) */}
          <View
            className="px-4 py-3 border-b flex-row flex-wrap justify-between items-center gap-2"
            style={{
              backgroundColor: theme.headerBg,
              borderColor: theme.border,
            }}
          >
            <Text
              className="font-bold text-sm"
              style={{ color: theme.textPrimary }}
            >
              Items
            </Text>

            <View className="flex-row gap-2">
              {/* SCRAP CAMERA BUTTON */}
              <TouchableOpacity
                onPress={handleCaptureScrap}
                className="flex-row items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md border flex-shrink-0"
                style={{ borderColor: theme.border }}
              >
                <Camera size={14} color={theme.textPrimary} />
                <Text
                  className="text-xs font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  Scrap Scan
                </Text>
              </TouchableOpacity>

              {/* ADD ITEM BUTTON */}
              <TouchableOpacity
                onPress={handleAddItem}
                className="flex-row items-center gap-2 bg-blue-600 px-3 py-1.5 rounded-md flex-shrink-0"
              >
                <Plus size={16} color="white" />
                <Text className="text-white text-xs font-bold">Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Column Headers */}
          <View
            className="flex-row px-4 py-2 border-b"
            style={{
              backgroundColor: theme.subtleBorder,
              borderColor: theme.border,
            }}
          >
            <Text className="flex-[2] text-[10px] font-bold uppercase text-gray-500">
              Material Description
            </Text>
            <Text className="flex-1 text-[10px] font-bold uppercase text-gray-500 text-center">
              Weight
            </Text>
            <Text className="flex-1 text-[10px] font-bold uppercase text-gray-500 text-right">
              Subtotal
            </Text>
            <View className="w-8" />
          </View>

          {/* SCROLLABLE LIST */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {lineItems.length === 0 ? (
              <View className="flex-1 items-center justify-center py-10 opacity-50">
                <Text style={{ color: theme.textSecondary }}>
                  No items added yet.
                </Text>
              </View>
            ) : (
              lineItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleEditItem(item)}
                  className="flex-row px-4 py-3 items-center border-b"
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? theme.card : theme.background,
                    borderColor: theme.subtleBorder,
                  }}
                >
                  <View className="flex-[2]">
                    <Text
                      className="font-bold text-sm"
                      style={{ color: theme.textPrimary }}
                    >
                      {item.material}
                    </Text>
                    <Text className="text-[10px] text-gray-400">
                      @{formatCurrency(item.price)} / kg
                    </Text>
                  </View>

                  <Text
                    className="flex-1 text-center font-medium text-sm"
                    style={{ color: theme.textPrimary }}
                  >
                    {item.weight} {item.uom}
                  </Text>

                  <Text
                    className="flex-1 text-right font-bold text-sm"
                    style={{ color: theme.textPrimary }}
                  >
                    {formatCurrency(item.subtotal)}
                  </Text>

                  <Pressable
                    onPress={() => handleDeleteItem(item.id)}
                    className="w-8 items-end justify-center h-full opacity-60 hover:opacity-100"
                  >
                    <Trash2 size={16} color={theme.danger} />
                  </Pressable>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* TABLE FOOTER: Totals & Process Button */}
          <View
            className="p-4 border-t"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.headerBg,
            }}
          >
            {/* Grand Total - Using items-center instead of items-end to prevent squashing */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xs font-bold text-gray-500 uppercase flex-shrink-0 mr-2">
                Total
              </Text>
              <Text className="text-2xl font-black text-blue-600">
                {formatCurrency(grandTotal)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setFinishModalVisible(true)}
              className="w-full bg-blue-600 h-12 rounded-lg flex-row items-center justify-center gap-2"
            >
              <Check size={18} color="white" />
              <Text className="text-white font-bold text-sm">
                Process Transaction
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ======================= */}
      {/* MODAL: ADD / EDIT ITEM  */}
      {/* ======================= */}
      <Modal
        visible={addItemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddItemModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAddItemModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <View
              className="flex-row justify-between items-center mb-6 border-b pb-2"
              style={{ borderColor: theme.border }}
            >
              <Text
                className="text-lg font-bold"
                style={{ color: theme.textPrimary }}
              >
                {editingItemId ? "Edit Item" : "Add New Item"}
              </Text>
              <TouchableOpacity onPress={() => setAddItemModalVisible(false)}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Material
                </Text>
                <View
                  className="h-10 border rounded"
                  style={{ borderColor: theme.border }}
                >
                  <CustomPicker
                    selectedValue={newItemMaterialId}
                    onValueChange={setNewItemMaterialId}
                    placeholder="Select..."
                    items={materialsList}
                    theme={theme}
                  />
                </View>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Weight
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={newItemWeight}
                    onChangeText={setNewItemWeight}
                    className="h-10 border rounded px-3 font-bold"
                    style={{
                      color: theme.textPrimary,
                      borderColor: theme.border,
                      backgroundColor: theme.inputBg,
                    }}
                    placeholder="0.00"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Price
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={newItemPrice}
                    onChangeText={setNewItemPrice}
                    className="h-10 border rounded px-3 font-bold"
                    style={{
                      color: theme.textPrimary,
                      borderColor: theme.border,
                      backgroundColor: theme.inputBg,
                    }}
                    placeholder="0.00"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              </View>

              <View
                className="flex-row justify-between items-center mt-2 py-2 border-t"
                style={{ borderColor: theme.border }}
              >
                <Text className="text-xs text-gray-500">Subtotal:</Text>
                <Text className="text-lg font-bold text-blue-600">
                  ₱{newItemSubtotal}
                </Text>
              </View>

              <TouchableOpacity
                onPress={saveItem}
                className="bg-blue-600 p-3 rounded-lg items-center"
              >
                <Text className="text-white font-bold">Save Item</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ======================= */}
      {/* MODAL: PAY / CONFIRM    */}
      {/* ======================= */}
      <Modal
        visible={finishModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFinishModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFinishModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <View className="items-center mb-6">
              <Text
                className="text-lg font-bold"
                style={{ color: theme.textPrimary }}
              >
                Complete Transaction
              </Text>
            </View>

            <View
              className="mb-6 p-4 rounded bg-gray-50 dark:bg-gray-800 border"
              style={{ borderColor: theme.border }}
            >
              <Text className="text-xs text-gray-500 mb-1 text-center">
                Total Payable
              </Text>
              <Text className="font-black text-3xl text-blue-600 text-center">
                {formatCurrency(grandTotal)}
              </Text>
            </View>

            <Text
              className="text-[10px] uppercase font-bold mb-1 ml-1"
              style={{ color: theme.textSecondary }}
            >
              Amount Paid
            </Text>
            <TextInput
              value={paidAmountInput}
              onChangeText={setPaidAmountInput}
              keyboardType="numeric"
              className="border rounded px-3 h-12 text-lg font-bold mb-6"
              style={{
                color: theme.textPrimary,
                borderColor: theme.border,
                backgroundColor: theme.inputBg,
              }}
              placeholder="0.00"
              placeholderTextColor={theme.placeholder}
            />

            <TouchableOpacity
              onPress={confirmFinish}
              className="h-12 bg-green-600 rounded-lg items-center justify-center"
            >
              <Text className="text-white font-bold">Confirm</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 6,
    paddingHorizontal: 10,
    height: "100%",
    width: "100%",
  },
  pickerText: { fontSize: 12, flex: 1 },
  pickerOptionsContainer: {
    width: 250,
    maxHeight: 200,
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  pickerTitle: { fontSize: 14, fontWeight: "bold" },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  pickerOptionText: { fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 380,
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
