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
import { desc, eq } from "drizzle-orm";
import { transactions } from "../../db/schema";
import { db } from "../_layout";

// Increased to 9 to fill more vertical space on standard screens
const ITEMS_PER_PAGE = 9;

export default function TransactionsIndex() {
  const [transactionList, setTransactionList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });

  // --- FILTER STATE ---
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([]);

  const loadData = async () => {
    try {
      const data = await db
        .select()
        .from(transactions)
        .where(eq(transactions.status, "Completed"))
        .orderBy(desc(transactions.id));

      setTransactionList(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load transactions");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // --- DERIVE FILTER OPTIONS DYNAMICALLY ---
  const uniqueTypes = useMemo(
    () => [
      ...new Set(transactionList.map((item) => item.type).filter(Boolean)),
    ],
    [transactionList],
  );
  const uniquePaymentMethods = useMemo(
    () => [
      ...new Set(
        transactionList.map((item) => item.paymentMethod).filter(Boolean),
      ),
    ],
    [transactionList],
  );

  // --- HANDLE NEW TRANSACTION ---
  const handleNewTransaction = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const result = await db
        .insert(transactions)
        .values({
          date: today,
          status: "Draft",
          totalAmount: 0,
        })
        .returning({ insertedId: transactions.id });

      const newId = result[0].insertedId;

      router.push({
        pathname: "/transactionSummary",
        params: { transactionId: newId },
      });
    } catch (error) {
      Alert.alert("Error", "Could not initialize transaction");
    }
  };

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

  // --- PROCESSING DATA (Filter -> Sort -> Paginate) ---
  const processedData = useMemo(() => {
    let data = [...transactionList];

    // 1. Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.id.toString().includes(lowerQuery) ||
          (item.type && item.type.toLowerCase().includes(lowerQuery)),
      );
    }

    // 2. Category Filters
    if (selectedTypes.length > 0) {
      data = data.filter((item) => selectedTypes.includes(item.type));
    }
    if (selectedPaymentMethods.length > 0) {
      data = data.filter((item) =>
        selectedPaymentMethods.includes(item.paymentMethod),
      );
    }

    // 3. Sorting
    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "id" || sortConfig.key === "totalAmount") {
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
  ]);

  // 4. Pagination
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedList = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTypes, selectedPaymentMethods]);

  const toggleSelection = (list, setList, value) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* --- TOP BAR (Fixed Height) --- */}
      <View className="h-14 flex-row items-center justify-between gap-2">
        <View className="flex-1 h-full flex-row items-center bg-white rounded-md px-3 border border-gray-200">
          <Search size={24} color="gray" />
          <TextInput
            placeholder="Search ID or Type..."
            className="flex-1 ml-2 text-lg text-gray-700 h-full"
            style={{ textAlignVertical: "center" }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className={`h-full aspect-square items-center justify-center rounded-md border ${selectedTypes.length > 0 || selectedPaymentMethods.length > 0 ? "bg-blue-100 border-blue-500" : "bg-white border-gray-200"}`}
        >
          <Filter
            size={24}
            color={
              selectedTypes.length > 0 || selectedPaymentMethods.length > 0
                ? "#2563eb"
                : "gray"
            }
          />
        </Pressable>

        <Pressable
          onPress={handleNewTransaction}
          className="h-full flex-row items-center justify-center bg-primary rounded-md px-6 active:bg-blue-700"
        >
          <Plus size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">New</Text>
        </Pressable>
      </View>

      {/* --- TABLE (Flex 1 - Fills Remaining Space) --- */}
      <View className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <View className="flex-row bg-gray-800 p-4">
          {[
            { label: "ID", key: "id" },
            { label: "Type", key: "type" },
            { label: "Payment", key: "paymentMethod" },
            { label: "Date", key: "date" },
            { label: "Total", key: "totalAmount" },
          ].map((col) => (
            <Pressable
              key={col.key}
              onPress={() => handleSort(col.key)}
              className="flex-1 flex-row items-center justify-center gap-2"
            >
              <Text className="font-bold text-white text-lg">{col.label}</Text>
              {renderSortIcon(col.key)}
            </Pressable>
          ))}
        </View>

        {/* List Content */}
        {paginatedList.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: "#888" }}>No transactions found.</Text>
          </View>
        ) : (
          <FlatList
            data={paginatedList}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ flexGrow: 1 }} // Ensures list fills height
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/transactionDetailed",
                    params: { transactionId: item.id },
                  })
                }
                // Use border-b on all items to separate rows clearly
                className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <Text className="flex-1 text-gray-800 text-center text-lg font-medium">
                  {item.id}
                </Text>
                <Text
                  className={`flex-1 text-center text-lg font-bold ${item.type === "Selling" ? "text-green-600" : "text-blue-600"}`}
                >
                  {item.type}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">
                  {item.paymentMethod}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">
                  {item.date}
                </Text>
                <Text className="flex-1 text-blue-700 text-center text-lg font-bold">
                  ₱{item.totalAmount?.toFixed(2)}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* --- PAGINATION CONTROLS (Fixed Height) --- */}
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

            {/* Filter Section: Transaction Type */}
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

            {/* Filter Section: Payment Method */}
            <View>
              <Text className="text-gray-600 font-bold mb-2">
                Payment Method
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {uniquePaymentMethods.map((method) => (
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

            {/* Modal Footer */}
            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelectedTypes([]);
                  setSelectedPaymentMethods([]);
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
