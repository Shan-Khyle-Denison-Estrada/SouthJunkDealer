import { router, useFocusEffect } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  X,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

// --- DATABASE IMPORTS ---
import { desc } from "drizzle-orm";
import { db } from "../../db/client";
import { transactions } from "../../db/schema";

const ITEMS_PER_PAGE = 9;

export default function TransactionsIndex() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6",
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937", // Gray-800
    textSecondary: isDark ? "#A1A1AA" : "#4b5563", // Gray-600
    border: isDark ? "#333333" : "#e5e7eb",
    inputBg: isDark ? "#2C2C2C" : "#ffffff",
    inputText: isDark ? "#FFFFFF" : "#000000", // Fixed: Explicit text color
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    headerBg: isDark ? "#0f0f0f" : "#1f2937", // Darker header in dark mode
    primary: "#2563eb",
  };

  const [transactionList, setTransactionList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const loadTransactions = async () => {
    try {
      const data = await db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.id));
      setTransactionList(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load transactions");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, []),
  );

  const getPaymentStatus = (item) => {
    if (item.type !== "Buying" && item.type !== "Selling") {
      return {
        label: "N/A",
        // Keep badges somewhat distinct but readable
        bgColor: isDark ? "#374151" : "#f3f4f6", // Gray-700 : Gray-100
        textColor: isDark ? "#9CA3AF" : "#6b7280",
        borderColor: isDark ? "#4B5563" : "#e5e7eb",
      };
    }
    const paid = item.paidAmount || 0;
    const total = item.totalAmount || 0;
    if (paid >= total && total > 0)
      return {
        label: "Paid",
        bgColor: isDark ? "#064e3b" : "#dcfce7", // Green-900 : Green-100
        textColor: isDark ? "#6ee7b7" : "#15803d", // Green-300 : Green-700
        borderColor: isDark ? "#065f46" : "#bbf7d0",
      };
    if (paid > 0)
      return {
        label: "Partial",
        bgColor: isDark ? "#451a03" : "#fef9c3", // Yellow-900 : Yellow-100
        textColor: isDark ? "#fcd34d" : "#a16207", // Yellow-300 : Yellow-700
        borderColor: isDark ? "#78350f" : "#fde047",
      };
    return {
      label: "Unpaid",
      bgColor: isDark ? "#450a0a" : "#fee2e2", // Red-900 : Red-100
      textColor: isDark ? "#fca5a5" : "#b91c1c", // Red-300 : Red-700
      borderColor: isDark ? "#7f1d1d" : "#fecaca",
    };
  };

  const filteredData = useMemo(() => {
    let data = [...transactionList];
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      data = data.filter(
        (t) =>
          t.id.toString().includes(lower) ||
          (t.clientName && t.clientName.toLowerCase().includes(lower)) ||
          (t.type && t.type.toLowerCase().includes(lower)),
      );
    }
    if (selectedTypes.length > 0)
      data = data.filter((t) => selectedTypes.includes(t.type));
    if (selectedPaymentMethods.length > 0)
      data = data.filter((t) =>
        selectedPaymentMethods.includes(t.paymentMethod),
      );
    if (selectedStatuses.length > 0) {
      data = data.filter((t) =>
        selectedStatuses.includes(getPaymentStatus(t).label),
      );
    }
    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (["id", "totalAmount", "paidAmount"].includes(sortConfig.key)) {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
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
    transactionList,
    searchQuery,
    sortConfig,
    selectedTypes,
    selectedPaymentMethods,
    selectedStatuses,
    isDark, // Added dependency for status color recalc
  ]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedList = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const renderSortIcon = (key) =>
    sortConfig.key === key ? (
      sortConfig.direction === "asc" ? (
        <ArrowUp size={16} color="white" />
      ) : (
        <ArrowDown size={16} color="white" />
      )
    ) : null;

  const toggleSelection = (list, setList, value) =>
    setList(
      list.includes(value) ? list.filter((i) => i !== value) : [...list, value],
    );

  const uniqueTypes = [
    ...new Set(transactionList.map((t) => t.type).filter(Boolean)),
  ];
  const uniqueMethods = [
    ...new Set(transactionList.map((t) => t.paymentMethod).filter(Boolean)),
  ];

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
            placeholder="Search transactions..."
            placeholderTextColor={theme.placeholder}
            style={{ color: theme.inputText }} // FIX: Explicit Text Color
            className="flex-1 ml-2 text-lg h-full"
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              setCurrentPage(1);
            }}
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
              selectedTypes.length > 0 ||
              selectedPaymentMethods.length > 0 ||
              selectedStatuses.length > 0
                ? isDark
                  ? "#1e3a8a"
                  : "#dbeafe" // blue-900 : blue-100
                : theme.card,
            borderColor:
              selectedTypes.length > 0 ||
              selectedPaymentMethods.length > 0 ||
              selectedStatuses.length > 0
                ? theme.primary
                : theme.border,
          }}
        >
          <Filter
            size={24}
            color={
              selectedTypes.length > 0 ||
              selectedPaymentMethods.length > 0 ||
              selectedStatuses.length > 0
                ? theme.primary
                : theme.textSecondary
            }
          />
        </Pressable>

        <Pressable
          className="h-full flex-row items-center justify-center bg-primary rounded-md px-4 active:opacity-80"
          style={{ backgroundColor: "#F2C94C" }} // Always Blue Primary
          onPress={() => router.push("/transactionSummary")}
        >
          <Plus size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">
            New Transaction
          </Text>
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
            { label: "ID", key: "id", flex: 0.5 },
            { label: "Date", key: "date", flex: 1 },
            { label: "Client", key: "clientName", flex: 1.5 },
            { label: "Type", key: "type", flex: 0.8 },
            { label: "Status", key: "paidAmount", flex: 1 },
            { label: "Total", key: "totalAmount", flex: 1 },
          ].map((col) => (
            <Pressable
              key={col.key}
              onPress={() => handleSort(col.key)}
              style={{ flex: col.flex }}
              className="flex-row items-center justify-center gap-2"
            >
              <Text className="font-bold text-white text-lg">{col.label}</Text>
              {renderSortIcon(col.key)}
            </Pressable>
          ))}
        </View>

        <FlatList
          data={paginatedList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={({ item, index }) => {
            const status = getPaymentStatus(item);
            const rowBg = index % 2 === 0 ? theme.rowEven : theme.rowOdd;

            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/transactionDetailed",
                    params: { transactionId: item.id },
                  })
                }
                style={{
                  backgroundColor: rowBg,
                  borderColor: theme.border,
                }}
                className="flex-row items-center p-5 border-b active:opacity-70"
              >
                <Text
                  style={{ flex: 0.5, color: theme.textPrimary }}
                  className="text-center text-lg font-medium"
                >
                  #{item.id}
                </Text>
                <Text
                  style={{ flex: 1, color: theme.textSecondary }}
                  className="text-center text-lg"
                >
                  {item.date}
                </Text>
                <Text
                  style={{ flex: 1.5, color: theme.textSecondary }}
                  className="text-center text-lg"
                  numberOfLines={1}
                >
                  {item.clientName || "-"}
                </Text>
                <Text
                  style={{ flex: 0.8 }}
                  className={`text-center text-lg font-bold ${
                    item.type === "Selling" ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {item.type || "-"}
                </Text>

                <View
                  style={{ flex: 1 }}
                  className="items-center justify-center"
                >
                  <View
                    className="px-2 py-1 rounded border"
                    style={{
                      backgroundColor: status.bgColor,
                      borderColor: status.borderColor,
                    }}
                  >
                    <Text
                      className="text-xs font-bold uppercase"
                      style={{ color: status.textColor }}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                <Text
                  style={{ flex: 1 }}
                  className="text-blue-700 text-center text-lg font-bold"
                >
                  ₱{item.totalAmount ? item.totalAmount.toFixed(2) : "0.00"}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* --- PAGINATION --- */}
      <View className="h-14 flex-row items-center justify-center gap-3">
        <Pressable
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{
            backgroundColor: currentPage === 1 ? theme.background : theme.card,
            borderColor: theme.border,
          }}
          className="h-full aspect-square items-center justify-center border rounded-md"
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
          style={{
            backgroundColor:
              currentPage >= totalPages ? theme.background : theme.card,
            borderColor: theme.border,
          }}
          className="h-full aspect-square items-center justify-center border rounded-md"
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
          className="flex-1 bg-black/50 justify-center items-center p-4"
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable
            className="w-full max-w-md rounded-lg p-6 gap-4 shadow-xl"
            style={{ backgroundColor: theme.card }}
            onPress={() => {}} // Trap clicks
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

            {/* SECTIONS */}
            {[
              {
                title: "Payment Status",
                options: ["Paid", "Partial", "Unpaid"],
                selected: selectedStatuses,
                setter: setSelectedStatuses,
              },
              {
                title: "Transaction Type",
                options: uniqueTypes,
                selected: selectedTypes,
                setter: setSelectedTypes,
              },
              {
                title: "Payment Method",
                options: uniqueMethods,
                selected: selectedPaymentMethods,
                setter: setSelectedPaymentMethods,
              },
            ].map((section, idx) => (
              <View key={idx}>
                <Text
                  className="font-bold mb-2"
                  style={{ color: theme.textSecondary }}
                >
                  {section.title}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {section.options.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() =>
                        toggleSelection(section.selected, section.setter, opt)
                      }
                      style={{
                        backgroundColor: section.selected.includes(opt)
                          ? isDark
                            ? "#1e3a8a" // Dark Mode Active Bg
                            : "#dbeafe" // Light Mode Active Bg
                          : theme.background, // Inactive Bg
                        borderColor: section.selected.includes(opt)
                          ? "#2563eb"
                          : theme.border,
                      }}
                      className="px-4 py-2 rounded-full border"
                    >
                      <Text
                        style={{
                          color: section.selected.includes(opt)
                            ? "#2563eb"
                            : theme.textSecondary,
                          fontWeight: section.selected.includes(opt)
                            ? "bold"
                            : "normal",
                        }}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelectedTypes([]);
                  setSelectedPaymentMethods([]);
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
                style={{ backgroundColor: "#2563eb" }}
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
