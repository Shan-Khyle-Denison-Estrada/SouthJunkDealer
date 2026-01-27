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
import { desc, eq } from "drizzle-orm";
// Added 'materials' to imports
import { db } from "../../db/client";
import { auditTrails, inventory, materials } from "../../db/schema";

// Limit items per page to fill the screen nicely
const ITEMS_PER_PAGE = 9;

export default function AuditIndex() {
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
    inputText: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    headerBg: isDark ? "#0f0f0f" : "#1f2937",
    primary: "#2563eb",
    highlightBg: isDark ? "#1e3a8a" : "#dbeafe", // Blue-900 : Blue-100
  };

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
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  const loadAuditData = async () => {
    try {
      const result = await db
        .select({
          id: auditTrails.id,
          batchId: inventory.batchId,
          material: materials.name,
          action: auditTrails.action,
          note: auditTrails.notes,
          date: auditTrails.date,
        })
        .from(auditTrails)
        .leftJoin(inventory, eq(auditTrails.inventoryId, inventory.id))
        .leftJoin(materials, eq(inventory.materialId, materials.id))
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
        return isDark ? "text-green-400" : "text-green-600";
      case "damaged":
        return isDark ? "text-red-400" : "text-red-600";
      case "adjusted":
        return isDark ? "text-blue-400" : "text-blue-600";
      case "added":
        return "text-[#F2C94C]";
      case "deleted":
        return "text-gray-400 italic";
      default:
        return isDark ? "text-gray-300" : "text-gray-800";
    }
  };

  // --- DERIVE FILTER OPTIONS DYNAMICALLY ---
  const uniqueActions = useMemo(
    () => [...new Set(auditData.map((item) => item.action).filter(Boolean))],
    [auditData],
  );

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

  // --- PROCESSING DATA ---
  const processedData = useMemo(() => {
    let data = [...auditData];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.batchId?.toLowerCase().includes(lowerQuery) ||
          item.material?.toLowerCase().includes(lowerQuery) ||
          item.action?.toLowerCase().includes(lowerQuery) ||
          (item.note && item.note.toLowerCase().includes(lowerQuery)) ||
          item.id.toString().includes(lowerQuery),
      );
    }

    if (selectedActions.length > 0) {
      data = data.filter((item) => selectedActions.includes(item.action));
    }

    if (selectedMaterials.length > 0) {
      data = data.filter((item) => selectedMaterials.includes(item.material));
    }

    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "id") {
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
  }, [auditData, searchQuery, sortConfig, selectedActions, selectedMaterials]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedList = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

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
    <View
      className="flex-1 p-4 gap-4"
      style={{ backgroundColor: theme.background }}
    >
      {/* --- TOP BAR --- */}
      <View className="h-14 flex-row items-center justify-between gap-2">
        {/* Search */}
        <View
          className="flex-1 h-full flex-row items-center rounded-md px-3 border"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
          }}
        >
          <Search size={20} color={theme.placeholder} />
          <TextInput
            placeholder="Search Audit..."
            placeholderTextColor={theme.placeholder}
            className="flex-1 ml-2 text-lg h-full"
            style={{ textAlignVertical: "center", color: theme.inputText }} // FIX: Explicit color
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

        {/* Filter Button */}
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className="h-full aspect-square items-center justify-center rounded-md border"
          style={{
            backgroundColor:
              selectedActions.length > 0 || selectedMaterials.length > 0
                ? theme.highlightBg
                : theme.card,
            borderColor:
              selectedActions.length > 0 || selectedMaterials.length > 0
                ? theme.primary
                : theme.border,
          }}
        >
          <Filter
            size={24}
            color={
              selectedActions.length > 0 || selectedMaterials.length > 0
                ? theme.primary
                : theme.textSecondary
            }
          />
        </Pressable>

        {/* New Audit Button */}
        <Pressable
          onPress={() => router.push("/scannedInventory")}
          className="h-full px-4 flex-row items-center justify-center rounded-md active:opacity-80"
          style={{ backgroundColor: "#F2C94C" }}
        >
          <Plus size={24} color="white" />
          <Text className="text-white font-bold text-lg ml-2">New Audit</Text>
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
        {/* Header */}
        <View
          className="flex-row p-4"
          style={{ backgroundColor: theme.headerBg }}
        >
          {[
            { label: "Audit ID", key: "id" },
            { label: "Batch ID", key: "batchId" },
            { label: "Material", key: "material" },
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
            <Text style={{ color: theme.textSecondary }}>
              No audit records found.
            </Text>
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
                className="flex-row items-center p-5 border-b active:opacity-70"
                style={{
                  backgroundColor:
                    index % 2 === 0 ? theme.rowEven : theme.rowOdd,
                  borderColor: theme.border,
                }}
              >
                <Text
                  className="flex-1 text-center text-lg font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  AUD-{item.id}
                </Text>
                <Text
                  className={`flex-1 text-center text-lg ${
                    item.action === "Deleted"
                      ? "text-gray-400 italic line-through"
                      : ""
                  }`}
                  style={
                    item.action !== "Deleted"
                      ? { color: theme.textSecondary }
                      : {}
                  }
                >
                  {item.batchId}
                </Text>
                <Text
                  className="flex-1 text-center text-lg"
                  style={{ color: theme.textSecondary }}
                >
                  {item.material || "-"}
                </Text>
                <Text
                  className={`flex-1 text-center text-lg font-bold ${getActionColor(item.action)}`}
                >
                  {item.action}
                </Text>
                <Text
                  className="flex-1 text-center text-lg"
                  style={{ color: theme.textSecondary }}
                  numberOfLines={1}
                >
                  {truncate(item.note, 20)}
                </Text>
                <Text
                  className="flex-1 text-center text-lg"
                  style={{ color: theme.textSecondary }}
                >
                  {item.date}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* --- PAGINATION CONTROLS --- */}
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
          className="h-full px-6 items-center justify-center rounded-md "
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
          className="flex-1 justify-center items-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable
            className="w-full max-w-md rounded-lg p-6 gap-4 shadow-xl"
            style={{ backgroundColor: theme.card }}
            onPress={() => {}}
          >
            <View className="flex-row justify-between items-center">
              <Text
                className="text-xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                Filter Audits
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Filter Section: Action */}
            <View>
              <Text
                className="font-bold mb-2"
                style={{ color: theme.textSecondary }}
              >
                Action Type
              </Text>
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
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: selectedActions.includes(action)
                        ? theme.highlightBg
                        : theme.background,
                      borderColor: selectedActions.includes(action)
                        ? theme.primary
                        : theme.border,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedActions.includes(action)
                          ? theme.primary
                          : theme.textSecondary,
                        fontWeight: selectedActions.includes(action)
                          ? "bold"
                          : "normal",
                      }}
                    >
                      {action}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter Section: Material */}
            <View>
              <Text
                className="font-bold mb-2"
                style={{ color: theme.textSecondary }}
              >
                Material
              </Text>
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
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: selectedMaterials.includes(mat)
                        ? theme.highlightBg
                        : theme.background,
                      borderColor: selectedMaterials.includes(mat)
                        ? theme.primary
                        : theme.border,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedMaterials.includes(mat)
                          ? theme.primary
                          : theme.textSecondary,
                        fontWeight: selectedMaterials.includes(mat)
                          ? "bold"
                          : "normal",
                      }}
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
                  setSelectedMaterials([]);
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
