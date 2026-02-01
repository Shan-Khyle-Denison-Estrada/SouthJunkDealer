import { router, useFocusEffect } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
  XCircle
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
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

// --- PAGE SIZE ---
const ITEMS_PER_PAGE = 9;

// --- MOCK DATA ---
const MOCK_TRANSACTIONS = [
  {
    id: "BK-2026-101",
    date: "Feb 01, 2026",
    type: "Buy",
    item: "Copper Wire",
    status: "Pending",
    amount: "₱5,400",
  },
  {
    id: "BK-2026-102",
    date: "Jan 30, 2026",
    type: "Sell",
    item: "Mixed Scrap",
    status: "Processing",
    amount: "₱12,000",
  },
  {
    id: "BK-2026-103",
    date: "Jan 29, 2026",
    type: "Buy",
    item: "Aluminum Cans",
    status: "Completed",
    amount: "₱2,100",
  },
  {
    id: "BK-2026-104",
    date: "Jan 28, 2026",
    type: "Buy",
    item: "Steel Rods",
    status: "Rejected",
    amount: "₱8,500",
  },
  {
    id: "BK-2026-105",
    date: "Jan 27, 2026",
    type: "Sell",
    item: "Iron Ore",
    status: "Pending",
    amount: "₱45,000",
  },
  {
    id: "BK-2026-106",
    date: "Jan 26, 2026",
    type: "Buy",
    item: "Plastic Pellets",
    status: "Processing",
    amount: "₱1,200",
  },
  {
    id: "BK-2026-107",
    date: "Jan 25, 2026",
    type: "Buy",
    item: "Cartons",
    status: "Completed",
    amount: "₱500",
  },
  {
    id: "BK-2026-108",
    date: "Jan 24, 2026",
    type: "Sell",
    item: "Copper Wire",
    status: "Pending",
    amount: "₱6,300",
  },
  {
    id: "BK-2026-109",
    date: "Jan 23, 2026",
    type: "Buy",
    item: "Rubber Seals",
    status: "Pending",
    amount: "₱3,400",
  },
  {
    id: "BK-2026-110",
    date: "Jan 22, 2026",
    type: "Sell",
    item: "Mixed Scrap",
    status: "Completed",
    amount: "₱15,200",
  },
  {
    id: "BK-2026-111",
    date: "Jan 21, 2026",
    type: "Buy",
    item: "Lead Pipes",
    status: "Processing",
    amount: "₱4,100",
  },
  {
    id: "BK-2026-112",
    date: "Jan 20, 2026",
    type: "Buy",
    item: "Battery Cells",
    status: "Completed",
    amount: "₱900",
  },
  {
    id: "BK-2026-113",
    date: "Jan 19, 2026",
    type: "Buy",
    item: "Cardboard",
    status: "Rejected",
    amount: "₱200",
  },
  {
    id: "BK-2026-114",
    date: "Jan 18, 2026",
    type: "Sell",
    item: "Aluminum Sheets",
    status: "Pending",
    amount: "₱22,500",
  },
  {
    id: "BK-2026-115",
    date: "Jan 17, 2026",
    type: "Buy",
    item: "Glass Bottles",
    status: "Processing",
    amount: "₱800",
  },
  {
    id: "BK-2026-116",
    date: "Jan 16, 2026",
    type: "Buy",
    item: "Brass Fittings",
    status: "Completed",
    amount: "₱7,600",
  },
  {
    id: "BK-2026-117",
    date: "Jan 15, 2026",
    type: "Sell",
    item: "HMS 1&2",
    status: "Pending",
    amount: "₱150,000",
  },
  {
    id: "BK-2026-118",
    date: "Jan 14, 2026",
    type: "Buy",
    item: "E-Waste",
    status: "Rejected",
    amount: "₱5,000",
  },
  {
    id: "BK-2026-119",
    date: "Jan 13, 2026",
    type: "Buy",
    item: "Paper Waste",
    status: "Completed",
    amount: "₱300",
  },
  {
    id: "BK-2026-120",
    date: "Jan 12, 2026",
    type: "Sell",
    item: "Stainless Steel",
    status: "Processing",
    amount: "₱18,900",
  },
];

const TRANSACTION_TYPES = [
  { label: "Buy", value: "Buy" },
  { label: "Sell", value: "Sell" },
];

const TRANSACTION_STATUSES = [
  { label: "Pending", value: "Pending" },
  { label: "Processing", value: "Processing" },
  { label: "Completed", value: "Completed" },
  { label: "Rejected", value: "Rejected" },
];

// --- HELPER: Status Styles ---
const getStatusColorStyle = (status) => {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Processing":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "Pending":
      return "bg-orange-50 text-orange-700 border-orange-100";
    case "Rejected":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

export default function MaterialIndex() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6",
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937",
    textSecondary: isDark ? "#A1A1AA" : "#4b5563",
    border: isDark ? "#333333" : "#e5e7eb",
    subtleBorder: isDark ? "#2C2C2C" : "#f9fafb",
    inputBg: isDark ? "#2C2C2C" : "#f3f4f6",
    inputText: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    highlightBg: isDark ? "#1e3a8a" : "#eff6ff",
    headerBg: isDark ? "#0f0f0f" : "#1f2937",
    primary: "#2563eb",
  };

  const [transactionsData, setTransactionsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const loadData = () => {
    setTransactionsData(MOCK_TRANSACTIONS);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

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

      if (sortConfig.key === "amount") {
        valA = Number(valA.replace(/[^0-9.-]+/g, ""));
        valB = Number(valB.replace(/[^0-9.-]+/g, ""));
      } else if (sortConfig.key === "id") {
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

  const handleRowClick = (item) => {
    router.push({
      pathname: "/bookingDetailed",
      params: { bookingId: item.id },
    });
  };

  return (
    <View
      className="flex-1 p-4 gap-4"
      style={{ backgroundColor: theme.background }}
    >
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
          </View>
        ) : (
          <FlatList
            data={paginatedList}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleRowClick(item)}
                className="flex-row items-center p-5 border-b active:opacity-70"
                style={{
                  backgroundColor:
                    index % 2 === 0 ? theme.rowEven : theme.rowOdd,
                  borderColor: theme.border,
                }}
              >
                <Text
                  className="flex-[1.2] text-lg font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {item.id}
                </Text>
                <Text
                  className="flex-1 text-lg font-bold"
                  style={{ color: theme.textSecondary }}
                >
                  {item.date}
                </Text>
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
                <Text
                  className="flex-[1.5] text-lg font-bold"
                  style={{ color: theme.textSecondary }}
                  numberOfLines={1}
                >
                  {item.item}
                </Text>
                <View className="flex-[1.2] items-start">
                  <Text
                    className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wide border ${getStatusColorStyle(item.status)}`}
                  >
                    {item.status}
                  </Text>
                </View>
                {/* --- UPDATED: ONLY SHOW AMOUNT IF COMPLETED --- */}
                <Text
                  className="flex-1 text-left text-lg font-black"
                  style={{
                    color:
                      item.status === "Completed"
                        ? theme.textPrimary
                        : theme.textSecondary,
                  }}
                >
                  {item.status === "Completed" ? item.amount : "-"}
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
