import { router, useFocusEffect } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
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

// --- REVERTED TO ORIGINAL PAGE SIZE ---
const ITEMS_PER_PAGE = 9;

// --- MOCK DATA (Matched to Transactions.jsx) ---
const MOCK_TRANSACTIONS = [
  {
    id: "BK-2026-001",
    date: "Feb 01, 2026",
    type: "Buy",
    item: "Copper Wire",
    status: "Completed",
    amount: "₱5,400",
  },
  {
    id: "BK-2026-002",
    date: "Jan 28, 2026",
    type: "Sell",
    item: "Mixed Scrap",
    status: "Pending Approval",
    amount: "₱12,000",
  },
  {
    id: "BK-2026-003",
    date: "Jan 25, 2026",
    type: "Buy",
    item: "Aluminum Cans",
    status: "In Progress",
    amount: "₱2,100",
  },
  {
    id: "BK-2026-004",
    date: "Jan 22, 2026",
    type: "Buy",
    item: "Steel Rods",
    status: "Rejected",
    amount: "₱8,500",
  },
  {
    id: "BK-2026-005",
    date: "Jan 20, 2026",
    type: "Sell",
    item: "Iron Ore",
    status: "Scheduled",
    amount: "₱45,000",
  },
  {
    id: "BK-2026-006",
    date: "Jan 18, 2026",
    type: "Buy",
    item: "Plastic Pellets",
    status: "Completed",
    amount: "₱1,200",
  },
  {
    id: "BK-2026-007",
    date: "Jan 15, 2026",
    type: "Buy",
    item: "Cartons",
    status: "Cancelled",
    amount: "₱500",
  },
  {
    id: "BK-2026-008",
    date: "Jan 12, 2026",
    type: "Sell",
    item: "Copper Wire",
    status: "Completed",
    amount: "₱6,300",
  },
  {
    id: "BK-2026-009",
    date: "Jan 10, 2026",
    type: "Buy",
    item: "Rubber Seals",
    status: "Pending Approval",
    amount: "₱3,400",
  },
  {
    id: "BK-2026-010",
    date: "Jan 08, 2026",
    type: "Sell",
    item: "Mixed Scrap",
    status: "Completed",
    amount: "₱15,200",
  },
  {
    id: "BK-2026-011",
    date: "Jan 05, 2026",
    type: "Buy",
    item: "Lead Pipes",
    status: "In Progress",
    amount: "₱4,100",
  },
  {
    id: "BK-2026-012",
    date: "Jan 02, 2026",
    type: "Buy",
    item: "Battery Cells",
    status: "Completed",
    amount: "₱900",
  },
  {
    id: "BK-2026-013",
    date: "Jan 01, 2026",
    type: "Buy",
    item: "Cardboard",
    status: "Completed",
    amount: "₱200",
  },
];

const TRANSACTION_TYPES = [
  { label: "Buy", value: "Buy" },
  { label: "Sell", value: "Sell" },
];

const TRANSACTION_STATUSES = [
  { label: "Completed", value: "Completed" },
  { label: "Pending Approval", value: "Pending Approval" },
  { label: "In Progress", value: "In Progress" },
  { label: "Scheduled", value: "Scheduled" },
  { label: "Rejected", value: "Rejected" },
  { label: "Cancelled", value: "Cancelled" },
];

// --- HELPER: Status Styles ---
const getStatusColorStyle = (status) => {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Scheduled":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "Pending Approval":
      return "bg-orange-50 text-orange-700 border-orange-100";
    case "In Progress":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "Rejected":
    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

// --- CUSTOM PICKER COMPONENT ---
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
        <ChevronDown size={20} color={theme.textSecondary} />
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
              keyExtractor={(item) => item.value}
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

export default function MaterialIndex() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6",
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937", // Gray-800
    textSecondary: isDark ? "#A1A1AA" : "#4b5563", // Gray-600
    border: isDark ? "#333333" : "#e5e7eb",
    subtleBorder: isDark ? "#2C2C2C" : "#f9fafb",
    inputBg: isDark ? "#2C2C2C" : "#f3f4f6",
    inputText: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    highlightBg: isDark ? "#1e3a8a" : "#eff6ff", // Blue-900 : Blue-50
    headerBg: isDark ? "#0f0f0f" : "#1f2937",
    primary: "#2563eb",
  };

  // --- STATE ---
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Data State
  const [transactionsData, setTransactionsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting State
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  // Filter State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  // Form States (For Edit Modal)
  const [itemName, setItemName] = useState("");
  const [transType, setTransType] = useState(null);
  const [status, setStatus] = useState(null);

  // --- DATA LOADING (MOCKED) ---
  const loadData = () => {
    // Simulating fetching data
    setTransactionsData(MOCK_TRANSACTIONS);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // --- DERIVE FILTER OPTIONS DYNAMICALLY ---
  const uniqueTypes = useMemo(
    () => [
      ...new Set(transactionsData.map((item) => item.type).filter(Boolean)),
    ],
    [transactionsData],
  );

  const uniqueStatuses = useMemo(
    () => [
      ...new Set(transactionsData.map((item) => item.status).filter(Boolean)),
    ],
    [transactionsData],
  );

  // --- SORTING LOGIC ---
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={16} color="white" />
    ) : (
      <ArrowDown size={16} color="white" />
    );
  };

  // --- PROCESSING DATA ---
  const processedData = useMemo(() => {
    let data = [...transactionsData];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.item.toLowerCase().includes(lowerQuery) ||
          item.id.toLowerCase().includes(lowerQuery) ||
          item.status.toLowerCase().includes(lowerQuery),
      );
    }

    if (selectedTypes.length > 0) {
      data = data.filter((item) => selectedTypes.includes(item.type));
    }
    if (selectedStatuses.length > 0) {
      data = data.filter((item) => selectedStatuses.includes(item.status));
    }

    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // Clean currency for sorting
      if (sortConfig.key === "amount") {
        valA = Number(valA.replace(/[^0-9.-]+/g, ""));
        valB = Number(valB.replace(/[^0-9.-]+/g, ""));
      }
      // Handle ID sorting if needed
      else if (sortConfig.key === "id") {
        valA = valA.toString();
        valB = valB.toString();
      } else {
        valA = valA ? valA.toString().toLowerCase() : "";
        valB = valB ? valB.toString().toLowerCase() : "";
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [
    transactionsData,
    searchQuery,
    sortConfig,
    selectedTypes,
    selectedStatuses,
  ]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedList = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTypes, selectedStatuses]);

  const toggleSelection = (list, setList, value) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  // --- CRUD ACTIONS (MOCKED) ---

  const handleUpdateTransaction = () => {
    if (!selectedTransaction) return;

    // Update local state instead of DB
    const updatedData = transactionsData.map((item) => {
      if (item.id === selectedTransaction.id) {
        return {
          ...item,
          item: itemName,
          type: transType,
          status: status,
        };
      }
      return item;
    });

    setTransactionsData(updatedData);
    setEditModalVisible(false);
    resetForm();
    Alert.alert("Success", "Transaction updated (Frontend Mock)");
  };

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;

    // Delete from local state instead of DB
    const updatedData = transactionsData.filter(
      (item) => item.id !== selectedTransaction.id,
    );

    setTransactionsData(updatedData);
    setEditModalVisible(false);
    resetForm();
    Alert.alert("Success", "Transaction deleted (Frontend Mock)");
  };

  const handleRowClick = (item) => {
    // Navigate to the new detailed page
    router.push({
      pathname: "/bookingDetailed",
      params: { bookingId: item.id },
    });
  };

  const resetForm = () => {
    setItemName("");
    setTransType(null);
    setStatus(null);
    setSelectedTransaction(null);
  };

  return (
    <View
      className="flex-1 p-4 gap-4"
      style={{ backgroundColor: theme.background }}
    >
      {/* --- EDIT MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditModalVisible(false)}
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
                Edit: {selectedTransaction?.id}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textSecondary }}
                >
                  Item Details
                </Text>
                <TextInput
                  className="rounded-md px-3 h-12 border"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.inputText,
                  }}
                  value={itemName}
                  onChangeText={setItemName}
                />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text
                    className="font-bold mb-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Type
                  </Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={transType}
                      onValueChange={setTransType}
                      placeholder="Select..."
                      items={TRANSACTION_TYPES}
                      theme={theme}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text
                    className="font-bold mb-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Status
                  </Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={status}
                      onValueChange={setStatus}
                      placeholder="Select..."
                      items={TRANSACTION_STATUSES}
                      theme={theme}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={handleDeleteTransaction}
                className="flex-1 bg-red-600 p-3 rounded-md items-center flex-row justify-center gap-2"
              >
                <Trash2 size={20} color="white" />
                <Text className="font-bold text-white">Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateTransaction}
                className="flex-1 bg-blue-600 p-3 rounded-md items-center"
              >
                <Text className="font-bold text-white">Update</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- TOP BAR --- */}
      <View className="h-14 flex-row items-center justify-between gap-2">
        <View
          className="flex-1 h-full flex-row items-center rounded-md px-3 border"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
          }}
        >
          <Search size={24} color={theme.placeholder} />
          <TextInput
            placeholder="Search ID, Item..."
            placeholderTextColor={theme.placeholder}
            className="flex-1 ml-2 text-lg h-full"
            style={{ textAlignVertical: "center", color: theme.inputText }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
            >
              <XCircle size={20} color={theme.placeholder} />
            </TouchableOpacity>
          )}
        </View>

        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className="h-full aspect-square items-center justify-center rounded-md border"
          style={{
            backgroundColor:
              selectedTypes.length > 0 || selectedStatuses.length > 0
                ? theme.highlightBg
                : theme.card,
            borderColor:
              selectedTypes.length > 0 || selectedStatuses.length > 0
                ? theme.primary
                : theme.border,
          }}
        >
          <Filter
            size={24}
            color={
              selectedTypes.length > 0 || selectedStatuses.length > 0
                ? theme.primary
                : theme.textSecondary
            }
          />
        </Pressable>
      </View>

      {/* --- TABLE --- */}
      <View
        className="flex-1 rounded-lg overflow-hidden border"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        {/* HEADER: REVERTED TO ORIGINAL PADDING (p-4) AND TEXT SIZE (text-lg) */}
        <View
          className="flex-row p-4"
          style={{ backgroundColor: theme.headerBg }}
        >
          {[
            { label: "ID", key: "id", flex: 1.2 },
            { label: "Date", key: "date", flex: 1 },
            { label: "Type", key: "type", flex: 0.8 },
            { label: "Details", key: "item", flex: 1.5 },
            { label: "Status", key: "status", flex: 1.2 },
            { label: "Amount", key: "amount", flex: 1 },
          ].map((col) => (
            <Pressable
              key={col.key}
              onPress={() => handleSort(col.key)}
              style={{ flex: col.flex }}
              className="flex-row items-center justify-start gap-1"
            >
              <Text className="font-bold text-white text-lg uppercase">
                {col.label}
              </Text>
              {renderSortIcon(col.key)}
            </Pressable>
          ))}
        </View>

        {paginatedList.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: theme.textSecondary }}>
              No transactions found.
            </Text>
            <Text
              style={{
                color: theme.placeholder,
                fontSize: 12,
                marginTop: 5,
              }}
            >
              Try adjusting your search.
            </Text>
          </View>
        ) : (
          <FlatList
            data={paginatedList}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleRowClick(item)}
                // ROW: REVERTED TO ORIGINAL PADDING (p-5)
                className="flex-row items-center p-5 border-b active:opacity-70"
                style={{
                  backgroundColor:
                    index % 2 === 0 ? theme.rowEven : theme.rowOdd,
                  borderColor: theme.border,
                }}
              >
                {/* ID - text-lg */}
                <Text
                  className="flex-[1.2] text-lg font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {item.id}
                </Text>

                {/* Date - text-lg */}
                <Text
                  className="flex-1 text-lg font-bold"
                  style={{ color: theme.textSecondary }}
                >
                  {item.date}
                </Text>

                {/* Type - Scaled up badge text for text-lg mimic */}
                <View className="flex-[0.8] items-start">
                  <Text
                    className={`px-3 py-1 rounded text-xs font-bold uppercase border ${
                      item.type === "Sell"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-blue-50 text-blue-700 border-blue-100"
                    }`}
                  >
                    {item.type}
                  </Text>
                </View>

                {/* Details (Item) - text-lg */}
                <Text
                  className="flex-[1.5] text-lg font-bold"
                  style={{ color: theme.textSecondary }}
                  numberOfLines={1}
                >
                  {item.item}
                </Text>

                {/* Status - Scaled up badge text */}
                <View className="flex-[1.2] items-start">
                  <Text
                    className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wide border ${getStatusColorStyle(item.status)}`}
                  >
                    {item.status}
                  </Text>
                </View>

                {/* Amount - text-lg */}
                <Text
                  className="flex-1 text-left text-lg font-black"
                  style={{ color: theme.textPrimary }}
                >
                  {item.amount}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* --- PAGINATION --- */}
      <View className="h-14 flex-row items-center justify-center gap-3">
        <Pressable
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="h-full aspect-square items-center justify-center border rounded-md"
          style={{
            backgroundColor: currentPage === 1 ? theme.background : theme.card,
            borderColor: theme.border,
          }}
        >
          <ChevronLeft
            size={24}
            color={currentPage === 1 ? theme.textSecondary : theme.textPrimary}
          />
        </Pressable>

        <View
          className="h-full px-6 items-center justify-center rounded-md"
          style={{ backgroundColor: "#F2C94C" }}
        >
          <Text className="text-white text-xl font-bold">
            {currentPage} / {totalPages || 1}
          </Text>
        </View>

        <Pressable
          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          className="h-full aspect-square items-center justify-center border rounded-md"
          style={{
            backgroundColor:
              currentPage >= totalPages ? theme.background : theme.card,
            borderColor: theme.border,
          }}
        >
          <ChevronRight
            size={24}
            color={
              currentPage >= totalPages
                ? theme.textSecondary
                : theme.textPrimary
            }
          />
        </Pressable>
      </View>

      {/* --- FILTER MODAL --- */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <View className="flex-row justify-between items-center">
              <Text
                className="text-xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                Filter Transactions
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Filter Section: Type */}
            <View className="mt-4">
              <Text
                className="font-bold mb-2"
                style={{ color: theme.textSecondary }}
              >
                Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() =>
                      toggleSelection(selectedTypes, setSelectedTypes, type)
                    }
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: selectedTypes.includes(type)
                        ? theme.highlightBg
                        : theme.background,
                      borderColor: selectedTypes.includes(type)
                        ? theme.primary
                        : theme.border,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedTypes.includes(type)
                          ? theme.primary
                          : theme.textSecondary,
                        fontWeight: selectedTypes.includes(type)
                          ? "bold"
                          : "normal",
                      }}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter Section: Status */}
            <View className="mt-4">
              <Text
                className="font-bold mb-2"
                style={{ color: theme.textSecondary }}
              >
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueStatuses.map((stat) => (
                  <TouchableOpacity
                    key={stat}
                    onPress={() =>
                      toggleSelection(
                        selectedStatuses,
                        setSelectedStatuses,
                        stat,
                      )
                    }
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: selectedStatuses.includes(stat)
                        ? theme.highlightBg
                        : theme.background,
                      borderColor: selectedStatuses.includes(stat)
                        ? theme.primary
                        : theme.border,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedStatuses.includes(stat)
                          ? theme.primary
                          : theme.textSecondary,
                        fontWeight: selectedStatuses.includes(stat)
                          ? "bold"
                          : "normal",
                      }}
                    >
                      {stat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Modal Footer */}
            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelectedTypes([]);
                  setSelectedStatuses([]);
                }}
                className="px-4 py-2"
              >
                <Text
                  className="font-medium"
                  style={{ color: theme.textSecondary }}
                >
                  Clear All
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFilterModalVisible(false)}
                className="px-6 py-2 rounded-md"
                style={{ backgroundColor: theme.primary }}
              >
                <Text className="text-white font-bold">Apply Filters</Text>
              </Pressable>
            </View>
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
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: "100%",
    width: "100%",
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  pickerOptionsContainer: {
    width: "40%",
    maxHeight: "50%",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "50%",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
