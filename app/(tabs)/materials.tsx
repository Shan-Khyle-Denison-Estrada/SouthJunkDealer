import { useFocusEffect } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown, // Imported ChevronDown
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Trash2,
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
import { desc, eq, sql } from "drizzle-orm";
import { inventory, materials, transactionItems } from "../../db/schema";
import { db } from "./_layout";

const ITEMS_PER_PAGE = 9;

// --- CUSTOM PICKER COMPONENT ---
const CustomPicker = ({ selectedValue, onValueChange, placeholder, items }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((i) => i.value === selectedValue);
  const displayLabel = selectedItem ? selectedItem.label : placeholder;

  return (
    <>
      {/* 1. The Trigger Field - Fully Clickable */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={styles.pickerTrigger}
      >
        <Text
          style={[styles.pickerText, !selectedValue && styles.placeholderText]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        {/* CHANGED: Used ChevronDown for a simple arrowhead without tail */}
        <ChevronDown size={20} color="gray" />
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
          <View style={styles.pickerOptionsContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="gray" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    selectedValue === item.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedValue === item.value &&
                        styles.pickerOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Check size={20} color="#2563eb" />
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
  // --- STATE ---
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Data State
  const [materialsData, setMaterialsData] = useState([]);
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
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedUoms, setSelectedUoms] = useState([]);

  // Form States
  const [materialName, setMaterialName] = useState("");
  const [materialClass, setMaterialClass] = useState(null);
  const [uom, setUom] = useState(null);

  const classOptions = [
    { label: "Class A (High Value)", value: "A" },
    { label: "Class B (Mid Value)", value: "B" },
    { label: "Class C (Low Value)", value: "C" },
  ];

  const uomOptions = [
    { label: "Kilograms (kg)", value: "kg" },
    { label: "Pounds (lbs)", value: "lbs" },
    { label: "Tons", value: "ton" },
    { label: "Units / Pieces", value: "units" },
  ];

  // --- DATA FETCHING ---
  const loadData = async () => {
    try {
      const data = await db
        .select({
          id: materials.id,
          name: materials.name,
          class: materials.class,
          uom: materials.uom,
          totalStock: sql`COALESCE(SUM(${inventory.netWeight}), 0)`,
        })
        .from(materials)
        .leftJoin(inventory, eq(materials.id, inventory.materialId))
        .groupBy(materials.id)
        .orderBy(desc(materials.id));

      setMaterialsData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load materials");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // --- DERIVE FILTER OPTIONS DYNAMICALLY ---
  const uniqueClasses = useMemo(
    () => [...new Set(materialsData.map((item) => item.class).filter(Boolean))],
    [materialsData],
  );
  const uniqueUoms = useMemo(
    () => [...new Set(materialsData.map((item) => item.uom).filter(Boolean))],
    [materialsData],
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
    let data = [...materialsData];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.id.toString().includes(lowerQuery) ||
          (item.class && item.class.toLowerCase().includes(lowerQuery)),
      );
    }

    if (selectedClasses.length > 0) {
      data = data.filter((item) => selectedClasses.includes(item.class));
    }
    if (selectedUoms.length > 0) {
      data = data.filter((item) => selectedUoms.includes(item.uom));
    }

    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "id" || sortConfig.key === "totalStock") {
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
  }, [materialsData, searchQuery, sortConfig, selectedClasses, selectedUoms]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedList = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClasses, selectedUoms]);

  const toggleSelection = (list, setList, value) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  // --- CRUD ACTIONS ---
  const handleAddMaterial = async () => {
    try {
      if (!materialName) {
        Alert.alert("Error", "Material Name is required");
        return;
      }
      if (!uom) {
        Alert.alert("Error", "UoM is required");
        return;
      }
      await db.insert(materials).values({
        name: materialName,
        class: materialClass,
        uom: uom,
      });
      setAddModalVisible(false);
      resetForm();
      loadData();
    } catch (error) {
      Alert.alert("Database Error", error.message);
    }
  };

  const handleUpdateMaterial = async () => {
    if (!selectedMaterial) return;
    try {
      await db
        .update(materials)
        .set({
          name: materialName,
          class: materialClass,
          uom: uom,
        })
        .where(eq(materials.id, selectedMaterial.id));
      setEditModalVisible(false);
      resetForm();
      loadData();
    } catch (error) {
      Alert.alert("Database Error", error.message);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return;
    try {
      const inInventory = await db
        .select()
        .from(inventory)
        .where(eq(inventory.materialId, selectedMaterial.id))
        .limit(1);

      const inTransactions = await db
        .select()
        .from(transactionItems)
        .where(eq(transactionItems.materialId, selectedMaterial.id))
        .limit(1);

      if (inInventory.length > 0 || inTransactions.length > 0) {
        Alert.alert(
          "Restricted",
          `Cannot delete "${selectedMaterial.name}". It is currently referenced by existing Inventory batches or Transaction records. You must delete those records first.`,
        );
        return;
      }

      await db.delete(materials).where(eq(materials.id, selectedMaterial.id));
      setEditModalVisible(false);
      resetForm();
      loadData();
    } catch (error) {
      Alert.alert("Database Error", error.message);
    }
  };

  const handleRowClick = (item) => {
    setSelectedMaterial(item);
    setMaterialName(item.name);
    setMaterialClass(item.class);
    setUom(item.uom);
    setEditModalVisible(true);
  };

  const resetForm = () => {
    setMaterialName("");
    setMaterialClass(null);
    setUom(null);
    setSelectedMaterial(null);
  };

  return (
    <View className="flex-1 bg-gray-100 p-4 gap-4">
      {/* --- ADD MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAddModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
              <Text className="text-xl font-bold text-gray-800">
                New Material
              </Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-gray-700 font-bold mb-1">
                  Material Name
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300"
                  placeholder="Ex: Copper Wire"
                  value={materialName}
                  onChangeText={setMaterialName}
                />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-gray-700 font-bold mb-1">
                    Class (Optional)
                  </Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={materialClass}
                      onValueChange={setMaterialClass}
                      placeholder="Select..."
                      items={classOptions}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 font-bold mb-1">
                    Unit of Measurement
                  </Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={uom}
                      onValueChange={setUom}
                      placeholder="Select..."
                      items={uomOptions}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                className="flex-1 bg-red-600 p-3 rounded-md items-center"
              >
                <Text className="font-bold text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddMaterial}
                className="flex-1 bg-green-600 p-3 rounded-md items-center"
              >
                <Text className="font-bold text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
              <Text className="text-xl font-bold text-gray-800">
                Edit Material: {selectedMaterial?.id}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-gray-700 font-bold mb-1">
                  Material Name
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-md px-3 h-12 border border-gray-300"
                  value={materialName}
                  onChangeText={setMaterialName}
                />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-gray-700 font-bold mb-1">
                    Class (Optional)
                  </Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={materialClass}
                      onValueChange={setMaterialClass}
                      placeholder="Select..."
                      items={classOptions}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 font-bold mb-1">UoM</Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={uom}
                      onValueChange={setUom}
                      placeholder="Select..."
                      items={uomOptions}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={handleDeleteMaterial}
                className="flex-1 bg-red-600 p-3 rounded-md items-center flex-row justify-center gap-2"
              >
                <Trash2 size={20} color="white" />
                <Text className="font-bold text-white">Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateMaterial}
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
        <View className="flex-1 h-full flex-row items-center bg-white rounded-md px-3 border border-gray-200">
          <Search size={24} color="gray" />
          <TextInput
            placeholder="Search Material..."
            className="flex-1 ml-2 text-lg text-gray-700 h-full"
            style={{ textAlignVertical: "center" }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className={`h-full aspect-square items-center justify-center rounded-md border ${selectedClasses.length > 0 || selectedUoms.length > 0 ? "bg-blue-100 border-blue-500" : "bg-white border-gray-200"}`}
        >
          <Filter
            size={24}
            color={
              selectedClasses.length > 0 || selectedUoms.length > 0
                ? "#2563eb"
                : "gray"
            }
          />
        </Pressable>

        <Pressable
          className="h-full flex-row items-center justify-center bg-primary rounded-md px-4 active:bg-blue-700"
          onPress={() => {
            resetForm();
            setAddModalVisible(true);
          }}
        >
          <Plus size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">New</Text>
        </Pressable>
      </View>

      {/* --- TABLE --- */}
      <View className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200">
        <View className="flex-row bg-gray-800 p-4">
          {[
            { label: "ID", key: "id", flex: 1 },
            { label: "Material Name", key: "name", flex: 2 },
            { label: "Class", key: "class", flex: 1 },
            { label: "Unit of Measurement", key: "uom", flex: 1 },
            { label: "Total Stock", key: "totalStock", flex: 1 },
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

        {paginatedList.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: "#888" }}>No materials found.</Text>
            {materialsData.length === 0 ? (
              <Text style={{ color: "#aaa", fontSize: 12, marginTop: 5 }}>
                Try adding a new material.
              </Text>
            ) : (
              <Text style={{ color: "#aaa", fontSize: 12, marginTop: 5 }}>
                Try adjusting your search.
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={paginatedList}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleRowClick(item)}
                className={`flex-row items-center p-5 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} active:bg-blue-50`}
              >
                <Text className="flex-1 text-gray-800 text-center text-lg font-medium">
                  {item.id}
                </Text>
                <Text className="flex-[2] text-gray-600 text-center text-lg">
                  {item.name}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">
                  {item.class}
                </Text>
                <Text className="flex-1 text-gray-600 text-center text-lg">
                  {item.uom}
                </Text>
                <Text className="flex-1 text-blue-700 text-center text-lg font-bold">
                  {Number(item.totalStock).toFixed(2)}
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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-800">
                Filter Materials
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="gray" />
              </Pressable>
            </View>

            {/* Filter Section: Class */}
            <View>
              <Text className="text-gray-600 font-bold mb-2">Class</Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueClasses.map((cls) => (
                  <TouchableOpacity
                    key={cls}
                    onPress={() =>
                      toggleSelection(selectedClasses, setSelectedClasses, cls)
                    }
                    className={`px-4 py-2 rounded-full border ${selectedClasses.includes(cls) ? "bg-blue-100 border-blue-500" : "bg-gray-50 border-gray-200"}`}
                  >
                    <Text
                      className={`${selectedClasses.includes(cls) ? "text-blue-700 font-bold" : "text-gray-600"}`}
                    >
                      {cls}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter Section: UoM */}
            <View>
              <Text className="text-gray-600 font-bold mb-2">
                Unit of Measure (UoM)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueUoms.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() =>
                      toggleSelection(selectedUoms, setSelectedUoms, unit)
                    }
                    className={`px-4 py-2 rounded-full border ${selectedUoms.includes(unit) ? "bg-blue-100 border-blue-500" : "bg-gray-50 border-gray-200"}`}
                  >
                    <Text
                      className={`${selectedUoms.includes(unit) ? "text-blue-700 font-bold" : "text-gray-600"}`}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Modal Footer */}
            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelectedClasses([]);
                  setSelectedUoms([]);
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // New Styles for the Custom Picker
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6", // Matched input bg
    borderWidth: 1,
    borderColor: "#d1d5db", // Matched input border
    borderRadius: 6,
    paddingHorizontal: 12,
    height: "100%", // Inherit height from parent View
    width: "100%",
  },
  pickerText: {
    fontSize: 16,
    color: "black",
    flex: 1,
  },
  placeholderText: {
    color: "#9ca3af",
  },
  // Modal Styles for Picker
  pickerOptionsContainer: {
    backgroundColor: "white",
    width: "40%", // Narrower than main modal
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
    borderBottomColor: "#f3f4f6",
    paddingBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  pickerOptionSelected: {
    backgroundColor: "#eff6ff",
    borderRadius: 6,
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#4b5563",
  },
  pickerOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  // Main Modal Styles
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
