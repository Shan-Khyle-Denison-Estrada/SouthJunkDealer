import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
    Ban,
    Camera,
    Check,
    ChevronDown,
    Eye,
    Hash,
    Image as ImageIcon,
    Mail,
    MapPin,
    Phone,
    Play,
    Plus,
    Trash2,
    X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
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

// --- MOCK DATABASE (Initial State with Payment Methods) ---
const MOCK_DB = {
  "BK-2026-101": {
    type: "Buying",
    client: "Juan Dela Cruz",
    affiliation: "JDC Construction",
    driver: "Mike Ross",
    plate: "ABC-123",
    weight: "2500",
    paymentMethod: "Cash",
    status: "Pending",
    date: "Feb 01, 2026",
    items: [
      {
        id: 1,
        material: "Copper Wire",
        price: 300,
        weight: 18,
        subtotal: 5400,
      },
    ],
  },
  "BK-2026-102": {
    type: "Selling",
    client: "Scrap Trading Co",
    affiliation: "STC Logistics",
    driver: "Harvey S.",
    plate: "XYZ-999",
    weight: "5000",
    paymentMethod: "Bank Transfer",
    status: "Processing",
    date: "Jan 30, 2026",
    items: [
      {
        id: 1,
        material: "Mixed Scrap",
        price: 12,
        weight: 1000,
        subtotal: 12000,
      },
    ],
  },
  "BK-2026-103": {
    type: "Buying",
    client: "Aling Nena",
    affiliation: null,
    driver: "N/A",
    plate: "N/A",
    weight: "0",
    paymentMethod: "Cash",
    status: "Completed",
    date: "Jan 29, 2026",
    items: [
      {
        id: 1,
        material: "Aluminum Cans",
        price: 21,
        weight: 100,
        subtotal: 2100,
      },
    ],
  },
  "BK-2026-104": {
    type: "Buying",
    client: "Construction Site A",
    affiliation: "Prime Build Corp",
    driver: "Mario B.",
    plate: "DEF-456",
    weight: "1200",
    paymentMethod: "Cheque",
    status: "Rejected",
    date: "Jan 28, 2026",
    rejectionNote: "Incorrect material grade provided by driver.",
    items: [
      { id: 1, material: "Steel Rods", price: 17, weight: 500, subtotal: 8500 },
    ],
  },
  "BK-2026-105": {
    type: "Selling",
    client: "Global Steel",
    affiliation: "Global Ind.",
    driver: "Luigi",
    plate: "GHI-789",
    weight: "15000",
    paymentMethod: "Bank Transfer",
    status: "Pending",
    date: "Jan 27, 2026",
    items: [
      { id: 1, material: "Iron Ore", price: 5, weight: 9000, subtotal: 45000 },
    ],
  },
  DEFAULT: {
    type: "Buying",
    client: "New Client",
    affiliation: "N/A",
    driver: "",
    plate: "",
    weight: "",
    paymentMethod: "Cash",
    status: "Pending",
    date: "Today",
    items: [],
  },
};

const MATERIALS_LIST = [
  { label: "Copper Wire", value: "m1", price: 300 },
  { label: "Mixed Scrap", value: "m2", price: 12 },
  { label: "Aluminum Cans", value: "m3", price: 21 },
  { label: "Steel Rods", value: "m4", price: 17 },
  { label: "Iron Ore", value: "m5", price: 5 },
  { label: "Plastic Pellets", value: "m6", price: 15 },
  { label: "Cartons", value: "m7", price: 2 },
];

const PAYMENT_METHODS = [
  { label: "Cash", value: "Cash" },
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "GCash", value: "GCash" },
  { label: "Cheque", value: "Cheque" },
];

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
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedItem = items.find((i) => i.value === selectedValue);
  const displayLabel = selectedItem ? selectedItem.label : placeholder;

  if (disabled) {
    return (
      <View
        style={[
          styles.pickerTrigger,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
            opacity: 0.6,
          },
        ]}
      >
        <Text
          style={[styles.pickerText, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
      </View>
    );
  }

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

  const bookingId = params.bookingId || "NEW";
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

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
  const [rejectionNote, setRejectionNote] = useState("");

  // Modals & Inputs
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);

  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Add Item State
  const [newItemMaterialId, setNewItemMaterialId] = useState(null);

  // --- PERSISTENCE: LOAD DATA ---
  const loadTransactionData = async () => {
    try {
      setLoading(true);
      // 1. Try to fetch saved data from phone storage
      const savedData = await AsyncStorage.getItem(`booking_${bookingId}`);

      let data;
      if (savedData) {
        data = JSON.parse(savedData);
      } else {
        data = MOCK_DB[bookingId] || MOCK_DB["DEFAULT"];
      }

      // 2. Populate State
      setTransactionType(data.type);
      setPaymentMethod(data.paymentMethod || ""); // Added Payment Method
      setClientName(data.client);
      setClientAffiliation(data.affiliation);
      setDriverName(data.driver);
      setTruckPlate(data.plate);
      setTruckWeight(data.weight);
      setStatus(data.status);
      setLineItems(data.items || []);
      setGrandTotal(
        (data.items || []).reduce((acc, curr) => acc + curr.subtotal, 0),
      );
      setRejectionNote(data.rejectionNote || "");
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isFirstLoad.current = false;
      }, 500);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactionData();
    }, [bookingId]),
  );

  // --- PERSISTENCE: SAVE DATA ---
  useEffect(() => {
    if (loading || isFirstLoad.current) return;

    const saveData = async () => {
      const dataToSave = {
        type: transactionType,
        paymentMethod: paymentMethod, // Added Payment Method
        client: clientName,
        affiliation: clientAffiliation,
        driver: driverName,
        plate: truckPlate,
        weight: truckWeight,
        status: status,
        items: lineItems,
        rejectionNote: rejectionNote,
        date: MOCK_DB[bookingId]?.date || "Today",
      };
      try {
        await AsyncStorage.setItem(
          `booking_${bookingId}`,
          JSON.stringify(dataToSave),
        );
        console.log("Auto-saved:", bookingId);
      } catch (e) {
        console.error("Failed to save", e);
      }
    };

    const debounceSave = setTimeout(() => {
      saveData();
    }, 500);

    return () => clearTimeout(debounceSave);
  }, [
    transactionType,
    paymentMethod,
    driverName,
    truckPlate,
    truckWeight,
    status,
    lineItems,
    rejectionNote,
  ]);

  // --- HANDLERS ---
  const handleAddItem = () => {
    if (status !== "Processing") return;
    setNewItemMaterialId(null);
    setAddItemModalVisible(true);
  };

  const saveItem = () => {
    if (!newItemMaterialId) return;
    const matName =
      MATERIALS_LIST.find((m) => m.value === newItemMaterialId)?.label ||
      "Unknown";
    const defPrice =
      MATERIALS_LIST.find((m) => m.value === newItemMaterialId)?.price || 0;

    let updatedItems = [...lineItems];
    updatedItems.push({
      id: Date.now(),
      material: matName,
      weight: 0,
      price: defPrice,
      subtotal: 0,
    });

    setLineItems(updatedItems);
    setGrandTotal(updatedItems.reduce((acc, curr) => acc + curr.subtotal, 0));
    setAddItemModalVisible(false);
  };

  const handleUpdateLineItem = (id, field, value) => {
    const updatedItems = lineItems.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        const w = parseFloat(field === "weight" ? value : item.weight) || 0;
        const p = parseFloat(field === "price" ? value : item.price) || 0;
        updatedItem.subtotal = w * p;
        return updatedItem;
      }
      return item;
    });
    setLineItems(updatedItems);
    setGrandTotal(updatedItems.reduce((acc, curr) => acc + curr.subtotal, 0));
  };

  const handleDeleteItem = (itemId) => {
    if (status !== "Processing") return;
    const updatedItems = lineItems.filter((i) => i.id !== itemId);
    setLineItems(updatedItems);
    setGrandTotal(updatedItems.reduce((acc, curr) => acc + curr.subtotal, 0));
  };

  const handleReject = () => {
    setStatus("Rejected");
    setRejectionNote(rejectionReason);
    setRejectModalVisible(false);
    Alert.alert("Rejected", "Booking has been rejected.");
  };

  const handleProcess = () => {
    setStatus("Processing");
    setProcessModalVisible(false);
    Alert.alert("Processing", "Booking is now in progress.");
  };

  const handleComplete = () => {
    setStatus("Completed");
    setFinishModalVisible(false);
    Alert.alert("Success", "Transaction finalized and paid.");
    router.back();
  };

  // --- HELPER CONSTANTS ---
  const clientInitials = clientName
    ? clientName.substring(0, 2).toUpperCase()
    : "NA";
  const clientBgColor = getRandomColor(clientName);

  const isPending = status === "Pending";
  const isProcessing = status === "Processing";
  const isCompleted = status === "Completed";
  const isRejected = status === "Rejected";

  const showTypeBadge = isPending || isRejected;
  const showLogisticsAndPayment = !isPending && !isRejected;
  const isEditable = isProcessing;

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View
      className="flex-1 flex-row"
      style={{ backgroundColor: theme.background }}
    >
      {/* SIDEBAR: CLIENT PROFILE */}
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
            className="text-xl font-bold text-center"
            style={{ color: theme.textPrimary }}
          >
            {clientName || "Unknown Client"}
          </Text>
          <Text
            className="text-sm font-medium text-center mb-8"
            style={{ color: theme.textSecondary }}
          >
            {clientAffiliation || "N/A"}
          </Text>

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

          <View style={{ flex: 1 }} />

          {/* Status Badge */}
          <View
            className="w-full p-4 rounded-xl border shadow-sm items-center justify-center mt-6"
            style={{
              backgroundColor:
                status === "Completed"
                  ? isDark
                    ? "#064e3b"
                    : "#ecfdf5"
                  : status === "Rejected"
                    ? isDark
                      ? "#450a0a"
                      : "#fef2f2"
                    : isDark
                      ? "#172554"
                      : "#eff6ff",
              borderColor:
                status === "Completed"
                  ? isDark
                    ? "#059669"
                    : "#6ee7b7"
                  : status === "Rejected"
                    ? isDark
                      ? "#dc2626"
                      : "#fca5a5"
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
                    : status === "Rejected"
                      ? isDark
                        ? "#fecaca"
                        : "#991b1b"
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
                    : status === "Rejected"
                      ? isDark
                        ? "#ffffff"
                        : "#991b1b"
                      : isDark
                        ? "#ffffff"
                        : "#1d4ed8",
              }}
            >
              {status}
            </Text>
          </View>

          {/* Admin Note */}
          {status === "Rejected" && rejectionNote && (
            <View className="w-full mt-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
              <Text className="text-xs font-bold text-red-800 dark:text-red-400 uppercase mb-1">
                Admin's Note
              </Text>
              <Text className="text-sm text-red-600 dark:text-red-300 italic">
                "{rejectionNote}"
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* MAIN AREA */}
      <View className="flex-1 flex-col p-6 gap-4" style={{ minWidth: 350 }}>
        {/* TOP HEADER */}
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-row items-center gap-2">
            <Hash size={28} color={theme.textSecondary} />
            <Text
              className="text-3xl font-black tracking-tight"
              style={{ color: theme.textPrimary }}
            >
              {bookingId}
            </Text>
            {/* Pending or Rejected: Show Type Badge Here */}
            {showTypeBadge && (
              <View
                className={`px-3 py-1 rounded-full border ${transactionType === "Selling" ? "bg-green-100 border-green-200" : "bg-blue-100 border-blue-200"}`}
              >
                <Text
                  className={`text-sm font-bold ${transactionType === "Selling" ? "text-green-700" : "text-blue-700"}`}
                >
                  {transactionType}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* LOGISTICS & PAYMENT HEADER CARD (ALWAYS VISIBLE) */}
        <View
          className="rounded-lg border bg-card p-4"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <View className="flex-row gap-6 mb-2">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Transaction Type
              </Text>
              <View className="h-12">
                <CustomPicker
                  selectedValue={transactionType}
                  onValueChange={setTransactionType}
                  placeholder="Select Type"
                  items={[
                    { label: "Buying (In)", value: "Buying" },
                    { label: "Selling (Out)", value: "Selling" },
                  ]}
                  theme={theme}
                  disabled={!isEditable}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Payment Method
              </Text>
              <View className="h-12">
                <CustomPicker
                  selectedValue={paymentMethod}
                  onValueChange={setPaymentMethod}
                  placeholder="Select Method"
                  items={PAYMENT_METHODS}
                  theme={theme}
                  disabled={!isEditable}
                />
              </View>
            </View>
          </View>

          {/* LOGISTICS INFO */}
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
                editable={isEditable}
                className="h-12 px-3 rounded border text-sm"
                style={{
                  backgroundColor: isEditable
                    ? theme.inputBg
                    : isDark
                      ? "#2A2A2A"
                      : "#F3F4F6",
                  borderColor: theme.border,
                  color: isEditable ? theme.textPrimary : theme.textSecondary,
                }}
                placeholder={isEditable ? "Enter Name" : "N/A"}
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
                editable={isEditable}
                className="h-12 px-3 rounded border text-sm"
                style={{
                  backgroundColor: isEditable
                    ? theme.inputBg
                    : isDark
                      ? "#2A2A2A"
                      : "#F3F4F6",
                  borderColor: theme.border,
                  color: isEditable ? theme.textPrimary : theme.textSecondary,
                }}
                placeholder={isEditable ? "ABC-123" : "N/A"}
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
                editable={isEditable}
                className="h-12 px-3 rounded border text-sm"
                style={{
                  backgroundColor: isEditable
                    ? theme.inputBg
                    : isDark
                      ? "#2A2A2A"
                      : "#F3F4F6",
                  borderColor: theme.border,
                  color: isEditable ? theme.textPrimary : theme.textSecondary,
                }}
                placeholder="0"
                placeholderTextColor={theme.placeholder}
              />
            </View>
            <TouchableOpacity
              onPress={() =>
                isCompleted ? setLicenseModalVisible(true) : null
              }
              disabled={!isEditable && !isCompleted}
              className="h-12 px-3 flex-row items-center gap-2 rounded border flex-shrink-0"
              style={{
                borderColor: theme.border,
                backgroundColor: isCompleted
                  ? isDark
                    ? "#1e3a8a"
                    : "#dbeafe"
                  : isDark
                    ? "#333"
                    : "#F3F4F6",
                opacity: isEditable || isCompleted ? 1 : 0.6,
              }}
            >
              {isCompleted ? (
                <Eye size={16} color={theme.primary} />
              ) : (
                <Camera size={16} color={theme.textSecondary} />
              )}
              <Text
                className="text-[10px] font-bold uppercase"
                style={{
                  color: isCompleted ? theme.primary : theme.textSecondary,
                }}
              >
                {isCompleted ? "View License" : "License"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View
          className="flex-1 rounded-lg border overflow-hidden"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
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
              {/* BUTTONS: ONLY VISIBLE IF PROCESSING */}
              {isProcessing && (
                <>
                  <TouchableOpacity
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
                  <TouchableOpacity
                    onPress={handleAddItem}
                    className="flex-row items-center gap-2 bg-blue-600 px-3 py-1.5 rounded-md flex-shrink-0"
                  >
                    <Plus size={16} color="white" />
                    <Text className="text-white text-xs font-bold">
                      Add Item
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View
            className="flex-row px-4 py-2 border-b gap-2"
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
            <Text className="flex-1 text-[10px] font-bold uppercase text-gray-500 text-center">
              Price/Unit
            </Text>
            <Text className="flex-1 text-[10px] font-bold uppercase text-gray-500 text-right">
              Subtotal
            </Text>
            <View className="w-8" />
          </View>

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
                <View
                  key={item.id}
                  className="flex-row px-4 py-3 items-center border-b gap-2"
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
                  </View>

                  {/* Weight Input */}
                  <View className="flex-1 items-center justify-center">
                    {isProcessing ? (
                      <TextInput
                        value={String(item.weight)}
                        onChangeText={(val) =>
                          handleUpdateLineItem(item.id, "weight", val)
                        }
                        keyboardType="numeric"
                        className="w-full text-center border rounded py-1 px-1 font-bold text-sm"
                        style={{
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.inputBg,
                        }}
                      />
                    ) : (
                      <Text
                        className="font-medium text-sm"
                        style={{ color: theme.textPrimary }}
                      >
                        {item.weight} kg
                      </Text>
                    )}
                  </View>

                  {/* Price Input */}
                  <View className="flex-1 items-center justify-center">
                    {isProcessing ? (
                      <TextInput
                        value={String(item.price)}
                        onChangeText={(val) =>
                          handleUpdateLineItem(item.id, "price", val)
                        }
                        keyboardType="numeric"
                        className="w-full text-center border rounded py-1 px-1 font-bold text-sm"
                        style={{
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.inputBg,
                        }}
                      />
                    ) : isCompleted ? (
                      <Text
                        className="font-medium text-sm"
                        style={{ color: theme.textPrimary }}
                      >
                        {formatCurrency(item.price)}
                      </Text>
                    ) : (
                      <Text className="font-bold text-gray-400">-</Text>
                    )}
                  </View>

                  {/* Subtotal */}
                  <View className="flex-1 items-end justify-center">
                    {isCompleted || isProcessing ? (
                      <Text
                        className="font-bold text-sm"
                        style={{ color: theme.textPrimary }}
                      >
                        {formatCurrency(item.subtotal)}
                      </Text>
                    ) : (
                      <Text className="font-bold text-gray-400">-</Text>
                    )}
                  </View>

                  {/* Delete Button (Processing only) */}
                  <View className="w-8 items-end">
                    {isProcessing ? (
                      <Pressable
                        onPress={() => handleDeleteItem(item.id)}
                        className="opacity-60 hover:opacity-100"
                      >
                        <Trash2 size={16} color={theme.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View
            className="p-4 border-t"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.headerBg,
            }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xs font-bold text-gray-500 uppercase flex-shrink-0 mr-2">
                Total
              </Text>
              <Text className="text-2xl font-black text-blue-600">
                {isCompleted || isProcessing ? formatCurrency(grandTotal) : "-"}
              </Text>
            </View>

            {isPending && (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setRejectModalVisible(true)}
                  className="flex-1 h-12 rounded-lg items-center justify-center border border-red-200 bg-red-50"
                >
                  <Text className="text-red-600 font-bold text-sm">Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setProcessModalVisible(true)}
                  className="flex-[2] bg-blue-600 h-12 rounded-lg flex-row items-center justify-center gap-2"
                >
                  <Play size={18} color="white" fill="white" />
                  <Text className="text-white font-bold text-sm">
                    Start Processing
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isProcessing && (
              <TouchableOpacity
                onPress={() => setFinishModalVisible(true)}
                className="w-full bg-green-600 h-12 rounded-lg flex-row items-center justify-center gap-2"
              >
                <Check size={18} color="white" />
                <Text className="text-white font-bold text-sm">
                  Complete Transaction
                </Text>
              </TouchableOpacity>
            )}

            {status === "Completed" && (
              <View className="w-full h-12 rounded-lg bg-gray-200 dark:bg-gray-800 items-center justify-center">
                <Text className="text-gray-500 font-bold">
                  Transaction Closed
                </Text>
              </View>
            )}

            {status === "Rejected" && (
              <View className="w-full h-12 rounded-lg bg-red-100 dark:bg-red-900/20 items-center justify-center">
                <Text className="text-red-500 font-bold">
                  Transaction Rejected
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* --- MODAL: ADD ITEM (Select Material Only) --- */}
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
                Add New Item
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
                  className="h-12 border rounded"
                  style={{ borderColor: theme.border }}
                >
                  <CustomPicker
                    selectedValue={newItemMaterialId}
                    onValueChange={setNewItemMaterialId}
                    placeholder="Select..."
                    items={MATERIALS_LIST}
                    theme={theme}
                  />
                </View>
              </View>
              <Text className="text-xs text-gray-500 italic">
                Select a material. You can enter weight and adjust price in the
                table.
              </Text>
              <TouchableOpacity
                onPress={saveItem}
                className="bg-blue-600 p-3 rounded-lg items-center"
              >
                <Text className="text-white font-bold">Add to List</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- MODAL: REJECT --- */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRejectModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <View className="items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mb-2">
                <Ban size={24} color="#ef4444" />
              </View>
              <Text
                className="text-lg font-bold"
                style={{ color: theme.textPrimary }}
              >
                Reject Booking?
              </Text>
              <Text className="text-center text-sm text-gray-500 mt-1">
                This action cannot be undone. Please provide a reason.
              </Text>
            </View>
            <TextInput
              multiline
              numberOfLines={3}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              className="border rounded p-3 mb-6 text-sm"
              style={{
                color: theme.textPrimary,
                borderColor: theme.border,
                backgroundColor: theme.inputBg,
                textAlignVertical: "top",
              }}
              placeholder="Reason for rejection..."
              placeholderTextColor={theme.placeholder}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                className="flex-1 py-3 rounded-lg border items-center"
                style={{ borderColor: theme.border }}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: "bold" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReject}
                className="flex-1 py-3 rounded-lg bg-red-600 items-center"
              >
                <Text className="text-white font-bold">Reject</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- MODAL: PROCESS CONFIRMATION --- */}
      <Modal
        visible={processModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProcessModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setProcessModalVisible(false)}
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
                Start Processing?
              </Text>
              <Text className="text-center text-sm text-gray-500 mt-2">
                This will move the booking to "In Progress". You can then add
                items and finalize the weight.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setProcessModalVisible(false)}
                className="flex-1 py-3 rounded-lg border items-center"
                style={{ borderColor: theme.border }}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: "bold" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleProcess}
                className="flex-1 py-3 rounded-lg bg-blue-600 items-center"
              >
                <Text className="text-white font-bold">Start</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- MODAL: FINISH / PAY --- */}
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
              className="border rounded px-3 h-14 text-lg font-bold mb-6"
              style={{
                color: theme.textPrimary,
                borderColor: theme.border,
                backgroundColor: theme.inputBg,
              }}
              placeholder="0.00"
              placeholderTextColor={theme.placeholder}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setFinishModalVisible(false)}
                className="flex-1 h-12 rounded-lg items-center justify-center border"
                style={{ borderColor: theme.border }}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: "bold" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleComplete}
                className="flex-[2] h-12 bg-green-600 rounded-lg items-center justify-center"
              >
                <Text className="text-white font-bold">Confirm Payment</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- MODAL: VIEW LICENSE --- */}
      <Modal
        visible={licenseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLicenseModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLicenseModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, width: 450 },
            ]}
            onPress={() => {}}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-lg font-bold"
                style={{ color: theme.textPrimary }}
              >
                Driver's License
              </Text>
              <TouchableOpacity onPress={() => setLicenseModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <View
              className="w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg items-center justify-center border-2 border-dashed"
              style={{ borderColor: theme.border }}
            >
              <ImageIcon size={48} color={theme.textSecondary} />
              <Text
                className="text-xs font-bold uppercase mt-2"
                style={{ color: theme.textSecondary }}
              >
                License Image Mock
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setLicenseModalVisible(false)}
              className="mt-4 w-full h-12 bg-blue-600 rounded-lg items-center justify-center"
            >
              <Text className="text-white font-bold">Close</Text>
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
