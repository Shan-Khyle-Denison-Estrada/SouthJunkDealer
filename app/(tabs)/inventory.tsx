import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  ChevronDown,
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

// --- DATABASE IMPORTS ---
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import {
  inventory,
  inventoryTransactionItems,
  materials,
} from "../../db/schema";

const ITEMS_PER_PAGE = 9;

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
      {/* 1. The Trigger Field */}
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

      {/* 2. The Options Modal */}
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
              keyExtractor={(item) => item.value?.toString()}
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

export default function InventoryIndex() {
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
    inputBg: isDark ? "#2C2C2C" : "#ffffff",
    inputText: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    highlightBg: isDark ? "#1e3a8a" : "#eff6ff", // Blue-900 : Blue-50
    headerBg: isDark ? "#0f0f0f" : "#1f2937",
    primary: "#2563eb",
  };

  // --- STATE ---
  const [modalVisible, setModalVisible] = useState(false);

  // Data State
  const [inventoryData, setInventoryData] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting State
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });

  // Filter State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  // Form State
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [imageUri, setImageUri] = useState(null);

  // --- DATA FETCHING ---
  const loadData = async () => {
    try {
      // 1. REPAIR DATA
      const zeroBatches = await db
        .select()
        .from(inventory)
        .where(
          and(eq(inventory.status, "In Stock"), eq(inventory.netWeight, 0)),
        );

      if (zeroBatches.length > 0) {
        for (const batch of zeroBatches) {
          const result = await db
            .select({
              totalAllocated: sql`sum(${inventoryTransactionItems.allocatedWeight})`,
            })
            .from(inventoryTransactionItems)
            .where(eq(inventoryTransactionItems.inventoryId, batch.id));

          const realWeight = result[0]?.totalAllocated || 0;

          if (realWeight > 0) {
            await db
              .update(inventory)
              .set({ netWeight: realWeight })
              .where(eq(inventory.id, batch.id));
          }
        }
      }

      // 2. Load Materials
      const materialsList = await db.select().from(materials);
      const options = materialsList.map((m) => ({
        label: m.name,
        value: m.id,
      }));
      setMaterialOptions(options);

      // 3. Load Inventory
      const invList = await db
        .select({
          id: inventory.id,
          batchId: inventory.batchId,
          netWeight: inventory.netWeight,
          date: inventory.date,
          status: inventory.status,
          materialName: materials.name,
          uom: materials.uom,
        })
        .from(inventory)
        .leftJoin(materials, eq(inventory.materialId, materials.id))
        .orderBy(desc(inventory.id));

      setInventoryData(invList);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load inventory");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // --- DERIVE FILTER OPTIONS ---
  const uniqueStatuses = useMemo(
    () => [
      ...new Set(inventoryData.map((item) => item.status).filter(Boolean)),
    ],
    [inventoryData],
  );
  const uniqueMaterials = useMemo(
    () => [
      ...new Set(
        inventoryData.map((item) => item.materialName).filter(Boolean),
      ),
    ],
    [inventoryData],
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
    let data = [...inventoryData];

    // 1. Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.batchId?.toLowerCase().includes(lowerQuery) ||
          (item.materialName &&
            item.materialName.toLowerCase().includes(lowerQuery)) ||
          item.status?.toLowerCase().includes(lowerQuery),
      );
    }

    // 2. Category Filters
    if (selectedStatuses.length > 0) {
      data = data.filter((item) => selectedStatuses.includes(item.status));
    }
    if (selectedMaterials.length > 0) {
      data = data.filter((item) =>
        selectedMaterials.includes(item.materialName),
      );
    }

    // 3. Sorting
    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "id" || sortConfig.key === "netWeight") {
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
    inventoryData,
    searchQuery,
    sortConfig,
    selectedStatuses,
    selectedMaterials,
  ]);

  // 4. Pagination
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedList = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatuses, selectedMaterials]);

  const toggleSelection = (list, setList, value) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  // --- CAMERA HANDLER ---
  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // --- ADD INVENTORY BATCH ---
  const handleSaveBatch = async () => {
    if (!selectedMaterialId) {
      Alert.alert("Error", "Please select a material");
      return;
    }

    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedBatchId = `BATCH-${randomSuffix}-A`;

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      const qrData = JSON.stringify({
        type: "inventory",
        batchId: generatedBatchId,
        action: "redirect",
        target: "/inventoryDetailed",
      });

      await db.insert(inventory).values({
        batchId: generatedBatchId,
        materialId: selectedMaterialId,
        netWeight: 0,
        date: today,
        status: "In Stock",
        imageUri: imageUri,
        qrContent: qrData,
      });

      setModalVisible(false);
      setSelectedMaterialId(null);
      setImageUri(null);
      loadData();
    } catch (error) {
      console.error("Save failed:", error);
      Alert.alert("Database Error", error.message);
    }
  };

  const getStatusColor = (status) => {
    // Keep status colors distinct but readable in dark mode
    switch (status?.toLowerCase()) {
      case "in stock":
        return isDark ? "text-green-400" : "text-green-600";
      case "depleted":
        return isDark ? "text-red-400" : "text-red-600";
      case "deleted":
        return "text-gray-400";
      case "processing":
        return isDark ? "text-blue-400" : "text-blue-600";
      case "shipped":
        return isDark ? "text-indigo-400" : "text-indigo-500";
      default:
        return isDark ? "text-gray-300" : "text-gray-800";
    }
  };

  return (
    <View
      className="flex-1 p-4 gap-4"
      style={{ backgroundColor: theme.background }}
    >
      {/* --- ADD MODAL --- */}
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
                New Inventory Batch
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textSecondary }}
                >
                  Material Category <Text className="text-red-500">*</Text>
                </Text>
                <View className="h-12">
                  <CustomPicker
                    selectedValue={selectedMaterialId}
                    onValueChange={setSelectedMaterialId}
                    placeholder="Select Material..."
                    items={materialOptions}
                    theme={theme}
                  />
                </View>
              </View>

              <View>
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textSecondary }}
                >
                  Batch Photo
                </Text>
                <TouchableOpacity
                  onPress={takePicture}
                  className="h-12 border rounded-md flex-row items-center justify-center gap-2"
                  style={{
                    backgroundColor: isDark ? "#1e3a8a" : "#eff6ff",
                    borderColor: isDark ? "#2563eb" : "#93c5fd",
                  }}
                >
                  <Camera size={20} color={theme.primary} />
                  <Text
                    className="font-semibold"
                    style={{ color: theme.primary }}
                  >
                    {imageUri ? "Retake Photo" : "Take Photo"}
                  </Text>
                </TouchableOpacity>
                {imageUri && (
                  <Text className="text-green-600 text-xs mt-1 text-center">
                    Photo captured successfully
                  </Text>
                )}
              </View>
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 bg-red-600 p-3 rounded-md items-center"
              >
                <Text className="font-bold text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveBatch}
                className="flex-1 bg-green-600 p-3 rounded-md items-center"
              >
                <Text className="font-bold text-white">Save</Text>
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
          <Search size={20} color={theme.placeholder} />
          <TextInput
            placeholder="Search Batch..."
            placeholderTextColor={theme.placeholder}
            className="flex-1 ml-2 text-lg h-full"
            style={{ textAlignVertical: "center", color: theme.inputText }} // FIX: Explicit Color
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
              selectedStatuses.length > 0 || selectedMaterials.length > 0
                ? isDark
                  ? "#1e3a8a"
                  : "#eff6ff"
                : theme.card,
            borderColor:
              selectedStatuses.length > 0 || selectedMaterials.length > 0
                ? theme.primary
                : theme.border,
          }}
        >
          <Filter
            size={24}
            color={
              selectedStatuses.length > 0 || selectedMaterials.length > 0
                ? theme.primary
                : theme.textSecondary
            }
          />
        </Pressable>

        <View className="flex-row gap-2 h-full">
          <Pressable
            onPress={() => {
              setModalVisible(true);
              setImageUri(null); // Reset photo
            }}
            className="px-4 h-full flex-row items-center justify-center rounded-md active:opacity-80"
            style={{ backgroundColor: "#F2C94C" }}
          >
            <Plus size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-2">New Batch</Text>
          </Pressable>
        </View>
      </View>

      {/* --- TABLE --- */}
      <View
        className="flex-1 rounded-lg overflow-hidden border"
        style={{ backgroundColor: theme.card, borderColor: theme.border }}
      >
        {/* Header with Sort */}
        <View
          className="flex-row p-4"
          style={{ backgroundColor: theme.headerBg }}
        >
          {[
            { label: "Batch ID", key: "batchId" },
            { label: "Material", key: "materialName" },
            { label: "Net Weight", key: "netWeight" },
            { label: "Date", key: "date" },
            { label: "Status", key: "status" },
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

        {paginatedList.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: theme.textSecondary }}>
              No inventory found.
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
                    pathname: "/inventoryDetailed",
                    params: { batchId: item.batchId },
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
                  {item.batchId}
                </Text>
                <Text
                  className="flex-1 text-center text-lg"
                  style={{ color: theme.textSecondary }}
                >
                  {item.materialName || "Unknown"}
                </Text>
                <Text
                  className="flex-1 text-center text-lg"
                  style={{ color: theme.textSecondary }}
                >
                  {(item.netWeight || 0).toFixed(2)} {item.uom || ""}
                </Text>
                <Text
                  className="flex-1 text-center text-lg"
                  style={{ color: theme.textSecondary }}
                >
                  {item.date}
                </Text>
                <Text
                  className={`flex-1 text-center text-lg font-bold ${getStatusColor(item.status)}`}
                >
                  {item.status}
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
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                Filter Inventory
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Filter Section: Material */}
            <View className="mb-4">
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

            {/* Filter Section: Status */}
            <View>
              <Text
                className="font-bold mb-2"
                style={{ color: theme.textSecondary }}
              >
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueStatuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() =>
                      toggleSelection(
                        selectedStatuses,
                        setSelectedStatuses,
                        status,
                      )
                    }
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: selectedStatuses.includes(status)
                        ? theme.highlightBg
                        : theme.background,
                      borderColor: selectedStatuses.includes(status)
                        ? theme.primary
                        : theme.border,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedStatuses.includes(status)
                          ? theme.primary
                          : theme.textSecondary,
                        fontWeight: selectedStatuses.includes(status)
                          ? "bold"
                          : "normal",
                      }}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Modal Footer */}
            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelectedMaterials([]);
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
  // --- Custom Picker Styles ---
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
  // --- Modal Styles ---
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
