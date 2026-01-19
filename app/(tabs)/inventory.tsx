import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  Camera,
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { and, desc, eq, sql } from "drizzle-orm";
import {
  inventory,
  inventoryTransactionItems,
  materials,
} from "../../db/schema";
import { db } from "./_layout";

const ITEMS_PER_PAGE = 9;

const CustomPicker = ({ selectedValue, onValueChange, placeholder, items }) => {
  const [isFocused, setIsFocused] = useState(false);
  const truncate = (str, n) =>
    str?.length > n ? str.substr(0, n - 1) + "..." : str;

  return (
    <View style={[styles.pickerContainer, isFocused && styles.pickerFocused]}>
      <View style={styles.visualContainer}>
        <Text
          style={[styles.pickerText, !selectedValue && styles.placeholderText]}
          numberOfLines={1}
        >
          {selectedValue
            ? items.find((i) => i.value === selectedValue)?.label ||
              selectedValue
            : placeholder}
        </Text>
        <View style={styles.arrowContainer}>
          <View style={[styles.roundedArrow, isFocused && styles.arrowOpen]} />
        </View>
      </View>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(v) => {
          onValueChange(v);
          setIsFocused(false);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.invisiblePicker}
        mode="dropdown"
      >
        <Picker.Item label={placeholder} value={null} enabled={false} />
        {items.map((item, index) => (
          <Picker.Item
            key={index}
            label={truncate(item.label, 25)}
            value={item.value}
          />
        ))}
      </Picker>
    </View>
  );
};

export default function InventoryIndex() {
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
      // 1. REPAIR DATA: Fix "In Stock" batches with 0 weight (if they have items)
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

  // --- DERIVE FILTER OPTIONS DYNAMICALLY ---
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

  // --- PROCESSING DATA (Filter -> Sort -> Paginate) ---
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

      // Numeric sorting for ID and Weight
      if (sortConfig.key === "id" || sortConfig.key === "netWeight") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else {
        // String sorting
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

  // Reset page on filter change
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

      // --- FIX: Use Local System Time instead of UTC (toISOString) ---
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;
      // -------------------------------------------------------------

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
        date: today, // Uses local date
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
    switch (status?.toLowerCase()) {
      case "in stock":
        return "text-green-600"; // Green for available
      case "depleted":
        return "text-red-600"; // Red for empty/critical
      case "deleted":
        return "text-gray-400"; // Faded gray for removed items
      case "processing":
        return "text-blue-600";
      case "shipped":
        return "text-indigo-500";
      default:
        return "text-gray-800";
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* --- ADD MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
              <Text className="text-xl font-bold text-gray-800">
                New Inventory Batch
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-gray-700 font-bold mb-1">
                  Material Category
                </Text>
                <View className="h-12">
                  <CustomPicker
                    selectedValue={selectedMaterialId}
                    onValueChange={setSelectedMaterialId}
                    placeholder="Select Material..."
                    items={materialOptions}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-700 font-bold mb-1">
                  Batch Photo
                </Text>
                <TouchableOpacity
                  onPress={takePicture}
                  className="h-12 bg-blue-100 border border-blue-300 rounded-md flex-row items-center justify-center gap-2"
                >
                  <Camera size={20} color="#2563EB" />
                  <Text className="text-blue-700 font-semibold">
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
          </View>
        </View>
      </Modal>

      {/* --- TOP BAR (Fixed Height) --- */}
      <View className="h-14 flex-row items-center justify-between gap-2">
        <View className="flex-1 h-full flex-row items-center bg-white rounded-md px-3 border border-gray-200">
          <Search size={20} color="gray" />
          <TextInput
            placeholder="Search Batch..."
            className="flex-1 ml-2 text-base text-gray-700 h-full"
            style={{ textAlignVertical: "center" }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Button */}
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className={`h-full aspect-square items-center justify-center rounded-md border ${selectedStatuses.length > 0 || selectedMaterials.length > 0 ? "bg-blue-100 border-blue-500" : "bg-white border-gray-200"}`}
        >
          <Filter
            size={24}
            color={
              selectedStatuses.length > 0 || selectedMaterials.length > 0
                ? "#2563eb"
                : "gray"
            }
          />
        </Pressable>

        <View className="flex-row gap-2 h-full">
          <Pressable
            onPress={() => {
              setModalVisible(true);
              setImageUri(null); // Reset photo
            }}
            className="px-4 h-full flex-row items-center justify-center bg-primary rounded-md active:bg-blue-700"
          >
            <Plus size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-2">New Batch</Text>
          </Pressable>
        </View>
      </View>

      {/* --- TABLE (Flex 1) --- */}
      <View className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200">
        {/* Header with Sort */}
        <View className="flex-row bg-gray-800 p-4">
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
            <Text style={{ color: "#888" }}>No inventory found.</Text>
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
                className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} active:bg-blue-50`}
              >
                <Text className="flex-1 text-gray-800 text-center text-lg font-medium">
                  {item.batchId}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">
                  {item.materialName || "Unknown"}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">
                  {(item.netWeight || 0).toFixed(2)} {item.uom || ""}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">
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

      {/* --- PAGINATION (Fixed Height) --- */}
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
                Filter Inventory
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="gray" />
              </Pressable>
            </View>

            {/* Filter Section: Material */}
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
                    className={`px-4 py-2 rounded-full border ${selectedMaterials.includes(mat) ? "bg-blue-100 border-blue-500" : "bg-gray-50 border-gray-200"}`}
                  >
                    <Text
                      className={`${selectedMaterials.includes(mat) ? "text-blue-700 font-bold" : "text-gray-600"}`}
                    >
                      {mat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter Section: Status */}
            <View>
              <Text className="text-gray-600 font-bold mb-2">Status</Text>
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

            {/* Modal Footer */}
            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelectedMaterials([]);
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

const styles = StyleSheet.create({
  pickerContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 6,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    width: "100%",
    borderWidth: 2,
    borderColor: "transparent",
  },
  pickerFocused: { borderColor: "#F2C94C" },
  visualContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: "100%",
    width: "100%",
  },
  pickerText: { fontSize: 16, color: "black", flex: 1, marginRight: 10 },
  placeholderText: { color: "#9ca3af" },
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 20,
    height: 20,
  },
  roundedArrow: {
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "black",
    transform: [{ rotate: "45deg" }],
    marginTop: -4,
    borderRadius: 2,
  },
  arrowOpen: { transform: [{ rotate: "225deg" }], marginTop: 4 },
  invisiblePicker: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    width: "100%",
    height: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
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
