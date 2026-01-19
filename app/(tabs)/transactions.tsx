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
} from "react-native";

// --- DATABASE IMPORTS ---
import { desc } from "drizzle-orm";
import { transactions } from "../../db/schema";
import { db } from "../_layout";

const ITEMS_PER_PAGE = 9;

export default function TransactionsIndex() {
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
        color: "bg-gray-100 text-gray-500 border-gray-200",
      };
    }
    const paid = item.paidAmount || 0;
    const total = item.totalAmount || 0;
    if (paid >= total && total > 0)
      return {
        label: "Paid",
        color: "bg-green-100 text-green-700 border-green-200",
      };
    if (paid > 0)
      return {
        label: "Partial",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      };
    return { label: "Unpaid", color: "bg-red-100 text-red-700 border-red-200" };
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
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* --- TOP BAR --- */}
      <View className="h-14 flex-row items-center justify-between gap-2">
        <View className="flex-1 h-full flex-row items-center bg-white rounded-md px-3 border border-gray-200">
          <Search size={24} color="gray" />
          <TextInput
            placeholder="Search transactions..."
            className="flex-1 ml-2 text-lg text-gray-700 h-full"
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              setCurrentPage(1);
            }}
          />
        </View>
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className={`h-full aspect-square items-center justify-center rounded-md border ${selectedTypes.length > 0 || selectedPaymentMethods.length > 0 || selectedStatuses.length > 0 ? "bg-blue-100 border-blue-500" : "bg-white border-gray-200"}`}
        >
          <Filter
            size={24}
            color={
              selectedTypes.length > 0 ||
              selectedPaymentMethods.length > 0 ||
              selectedStatuses.length > 0
                ? "#2563eb"
                : "gray"
            }
          />
        </Pressable>
        {/* CHANGED: Navigate only */}
        <Pressable
          className="h-full flex-row items-center justify-center bg-primary rounded-md px-4 active:bg-blue-700"
          onPress={() => router.push("/transactionSummary")}
        >
          <Plus size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">New</Text>
        </Pressable>
      </View>

      {/* --- TABLE --- */}
      <View className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200">
        <View className="flex-row bg-gray-800 p-4">
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
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/transactionDetailed",
                    params: { transactionId: item.id },
                  })
                }
                className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} active:bg-blue-50`}
              >
                <Text
                  style={{ flex: 0.5 }}
                  className="text-gray-800 text-center text-lg font-medium"
                >
                  #{item.id}
                </Text>
                <Text
                  style={{ flex: 1 }}
                  className="text-gray-600 text-center text-lg"
                >
                  {item.date}
                </Text>
                <Text
                  style={{ flex: 1.5 }}
                  className="text-gray-600 text-center text-lg"
                  numberOfLines={1}
                >
                  {item.clientName || "-"}
                </Text>
                <Text
                  style={{ flex: 0.8 }}
                  className={`text-center text-lg font-bold ${item.type === "Selling" ? "text-green-600" : "text-blue-600"}`}
                >
                  {item.type || "-"}
                </Text>
                <View
                  style={{ flex: 1 }}
                  className="items-center justify-center"
                >
                  <View className={`px-2 py-1 rounded border ${status.color}`}>
                    <Text
                      className={`text-xs font-bold uppercase ${status.color.split(" ")[1]}`}
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
          className={`h-full aspect-square items-center justify-center border rounded-md ${currentPage === 1 ? "bg-gray-100 border-gray-200" : "bg-white border-gray-300"}`}
        >
          <ChevronLeft size={24} color={currentPage === 1 ? "gray" : "black"} />
        </Pressable>
        <View className="h-full px-6 items-center justify-center bg-blue-600 rounded-md">
          <Text className="text-white text-xl font-bold">
            {currentPage} / {totalPages || 1}
          </Text>
        </View>
        <Pressable
          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          className={`h-full aspect-square items-center justify-center border rounded-md ${currentPage >= totalPages ? "bg-gray-100 border-gray-200" : "bg-white border-gray-300"}`}
        >
          <ChevronRight
            size={24}
            color={currentPage >= totalPages ? "gray" : "black"}
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
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-md rounded-lg p-6 gap-4 shadow-xl">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-800">
                Filter Transactions
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="gray" />
              </Pressable>
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-2">
                Payment Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {["Paid", "Unpaid"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() =>
                      toggleSelection(
                        selectedStatuses,
                        setSelectedStatuses,
                        status,
                      )
                    }
                    className={`px-4 py-2 rounded-full border ${selectedStatuses.includes(status) ? "bg-blue-100 border-blue-500" : "bg-gray-50 border-gray-200"}`}
                  >
                    <Text
                      className={`${selectedStatuses.includes(status) ? "text-blue-700 font-bold" : "text-gray-600"}`}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-2">
                Transaction Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() =>
                      toggleSelection(selectedTypes, setSelectedTypes, type)
                    }
                    className={`px-4 py-2 rounded-full border ${selectedTypes.includes(type) ? "bg-blue-100 border-blue-500" : "bg-gray-50 border-gray-200"}`}
                  >
                    <Text
                      className={`${selectedTypes.includes(type) ? "text-blue-700 font-bold" : "text-gray-600"}`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text className="text-gray-600 font-bold mb-2">
                Payment Method
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueMethods.map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() =>
                      toggleSelection(
                        selectedPaymentMethods,
                        setSelectedPaymentMethods,
                        method,
                      )
                    }
                    className={`px-4 py-2 rounded-full border ${selectedPaymentMethods.includes(method) ? "bg-blue-100 border-blue-500" : "bg-gray-50 border-gray-200"}`}
                  >
                    <Text
                      className={`${selectedPaymentMethods.includes(method) ? "text-blue-700 font-bold" : "text-gray-600"}`}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelectedTypes([]);
                  setSelectedPaymentMethods([]);
                  setSelectedStatuses([]);
                }}
                className="px-4 py-2"
              >
                <Text className="text-gray-500 font-medium">Clear All</Text>
              </Pressable>
              <Pressable
                onPress={() => setFilterModalVisible(false)}
                className="px-6 py-2 bg-primary rounded-md"
              >
                <Text className="text-white font-bold">Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
