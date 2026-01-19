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
// Added 'materials' to imports
import { auditTrails, inventory, materials } from "../../db/schema";
import { db } from "./_layout";

// Limit items per page to fill the screen nicely
const ITEMS_PER_PAGE = 9;

export default function AuditIndex() {
  const [auditData, setAuditData] = useState([]);
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
  const [selectedActions, setSelectedActions] = useState([]);
  // Added state for Material Filter
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  const loadAuditData = async () => {
    try {
      // Updated query to join materials table
      // Because we use Soft Delete for inventory, this JOIN still works even if the batch is marked "Deleted"
      const result = await db
        .select({
          id: auditTrails.id,
          batchId: inventory.batchId,
          material: materials.name, // Select Material Name
          action: auditTrails.action,
          note: auditTrails.notes,
          date: auditTrails.date,
        })
        .from(auditTrails)
        .leftJoin(inventory, eq(auditTrails.inventoryId, inventory.id))
        .leftJoin(materials, eq(inventory.materialId, materials.id)) // Join Materials
        .orderBy(desc(auditTrails.id));

      setAuditData(result);
    } catch (e) {
      console.error("Failed to load audit trails", e);
      Alert.alert("Error", "Failed to load audit trails");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAuditData();
    }, []),
  );

  // --- HELPER FUNCTIONS ---
  const truncate = (str, n) => {
    if (!str) return "";
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case "verified":
        return "text-green-600";
      case "damaged":
        return "text-red-600";
      case "adjusted":
        return "text-blue-600";
      case "added":
        return "text-[#F2C94C]";
      case "deleted": // --- NEW: Handle deleted action
        return "text-gray-400 italic";
      default:
        return "text-gray-800";
    }
  };

  // --- DERIVE FILTER OPTIONS DYNAMICALLY ---
  const uniqueActions = useMemo(
    () => [...new Set(auditData.map((item) => item.action).filter(Boolean))],
    [auditData],
  );

  // Derive unique materials for the filter list
  const uniqueMaterials = useMemo(
    () => [...new Set(auditData.map((item) => item.material).filter(Boolean))],
    [auditData],
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

  // --- PROCESSING DATA (Filter -> Sort -> Paginate) ---
  const processedData = useMemo(() => {
    let data = [...auditData];

    // 1. Search Filter (Updated to include material)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.batchId?.toLowerCase().includes(lowerQuery) ||
          item.material?.toLowerCase().includes(lowerQuery) || // Search by material
          item.action?.toLowerCase().includes(lowerQuery) ||
          (item.note && item.note.toLowerCase().includes(lowerQuery)) ||
          item.id.toString().includes(lowerQuery),
      );
    }

    // 2. Action Filter
    if (selectedActions.length > 0) {
      data = data.filter((item) => selectedActions.includes(item.action));
    }

    // 3. Material Filter
    if (selectedMaterials.length > 0) {
      data = data.filter((item) => selectedMaterials.includes(item.material));
    }

    // 4. Sorting
    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // Numeric sorting for ID
      if (sortConfig.key === "id") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else {
        // String sorting for everything else
        valA = valA ? valA.toString().toLowerCase() : "";
        valB = valB ? valB.toString().toLowerCase() : "";
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [auditData, searchQuery, sortConfig, selectedActions, selectedMaterials]);

  // 5. Pagination
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedList = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedActions, selectedMaterials]);

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
        {/* Search */}
        <View className="flex-1 h-full flex-row items-center bg-white rounded-md px-3 border border-gray-200">
          <Search size={20} color="gray" />
          <TextInput
            placeholder="Search Audit..."
            className="flex-1 ml-2 text-base text-gray-700 h-full"
            style={{ textAlignVertical: "center" }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Button */}
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className={`h-full aspect-square items-center justify-center rounded-md border ${
            selectedActions.length > 0 || selectedMaterials.length > 0
              ? "bg-blue-100 border-blue-500"
              : "bg-white border-gray-200"
          }`}
        >
          <Filter
            size={24}
            color={
              selectedActions.length > 0 || selectedMaterials.length > 0
                ? "#2563eb"
                : "gray"
            }
          />
        </Pressable>

        {/* New Audit Button */}
        <Pressable
          onPress={() => router.push("/scannedInventory")}
          className="h-full px-4 flex-row items-center justify-center bg-primary rounded-md active:bg-yellow-500"
        >
          <Plus size={24} color="white" />
          <Text className="text-white font-bold text-lg ml-2">New Audit</Text>
        </Pressable>
      </View>

      {/* --- TABLE (Flex 1 - Fills Remaining Space) --- */}
      <View className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <View className="flex-row bg-gray-800 p-4">
          {[
            { label: "Audit ID", key: "id" },
            { label: "Batch ID", key: "batchId" },
            { label: "Material", key: "material" }, // Added Material Column
            { label: "Action", key: "action" },
            { label: "Note", key: "note" },
            { label: "Date", key: "date" },
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
            <Text style={{ color: "#888" }}>No audit records found.</Text>
          </View>
        ) : (
          <FlatList
            data={paginatedList}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/detailedAuditTrail",
                    params: { id: item.id },
                  })
                }
                className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} active:bg-blue-50`}
              >
                <Text className="flex-1 text-gray-800 text-center text-lg font-medium">
                  AUD-{item.id}
                </Text>
                <Text
                  className={`flex-1 text-center text-lg ${item.action === "Deleted" ? "text-gray-400 italic line-through" : "text-gray-600"}`}
                >
                  {item.batchId}
                </Text>
                {/* Added Material Data Cell */}
                <Text className="flex-1 text-gray-600 text-center text-lg">
                  {item.material || "-"}
                </Text>
                <Text
                  className={`flex-1 text-center text-lg font-bold ${getActionColor(item.action)}`}
                >
                  {item.action}
                </Text>
                <Text
                  className="flex-1 text-gray-600 text-center text-lg"
                  numberOfLines={1}
                >
                  {truncate(item.note, 20)}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">
                  {item.date}
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
                Filter Audits
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="gray" />
              </Pressable>
            </View>

            {/* Filter Section: Action */}
            <View>
              <Text className="text-gray-600 font-bold mb-2">Action Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueActions.map((action) => (
                  <TouchableOpacity
                    key={action}
                    onPress={() =>
                      toggleSelection(
                        selectedActions,
                        setSelectedActions,
                        action,
                      )
                    }
                    className={`px-4 py-2 rounded-full border ${selectedActions.includes(action) ? "bg-blue-100 border-blue-500" : "bg-gray-50 border-gray-200"}`}
                  >
                    <Text
                      className={`${selectedActions.includes(action) ? "text-blue-700 font-bold" : "text-gray-600"}`}
                    >
                      {action}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* New Filter Section: Material */}
            <View>
              <Text className="text-gray-600 font-bold mb-2">Material</Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueMaterials.map((mat) => (
                  <TouchableOpacity
                    key={mat}
                    onPress={() =>
                      toggleSelection(
                        selectedMaterials,
                        setSelectedMaterials,
                        mat,
                      )
                    }
                    className={`px-4 py-2 rounded-full border ${selectedMaterials.includes(mat) ? "bg-purple-100 border-purple-500" : "bg-gray-50 border-gray-200"}`}
                  >
                    <Text
                      className={`${selectedMaterials.includes(mat) ? "text-purple-700 font-bold" : "text-gray-600"}`}
                    >
                      {mat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Modal Footer */}
            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelectedActions([]);
                  setSelectedMaterials([]); // Clear materials too
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
