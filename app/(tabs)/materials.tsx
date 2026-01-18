import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import {
    ArrowDown,
    ArrowUp,
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
import { desc, eq } from "drizzle-orm";
import { materials } from "../../db/schema";
import { db } from "./_layout";

const ITEMS_PER_PAGE = 9;

// --- REUSABLE PICKER ---
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
        .select()
        .from(materials)
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

  // --- PROCESSING DATA (Filter -> Sort -> Paginate) ---
  const processedData = useMemo(() => {
    let data = [...materialsData];

    // 1. Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.id.toString().includes(lowerQuery) ||
          (item.class && item.class.toLowerCase().includes(lowerQuery)),
      );
    }

    // 2. Category Filters
    if (selectedClasses.length > 0) {
      data = data.filter((item) => selectedClasses.includes(item.class));
    }
    if (selectedUoms.length > 0) {
      data = data.filter((item) => selectedUoms.includes(item.uom));
    }

    // 3. Sorting
    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // Numeric sorting for ID
      if (sortConfig.key === "id") {
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
  }, [materialsData, searchQuery, sortConfig, selectedClasses, selectedUoms]);

  // 4. Pagination
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedList = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page on filter change
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
      if (!materialClass) {
        Alert.alert("Error", "Class is required");
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                  <Text className="text-gray-700 font-bold mb-1">Class</Text>
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
          </View>
        </View>
      </Modal>

      {/* --- EDIT MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                  <Text className="text-gray-700 font-bold mb-1">Class</Text>
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
          </View>
        </View>
      </Modal>

      {/* --- TOP BAR (Fixed Height) --- */}
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

        {/* Filter Button */}
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

      {/* --- TABLE (Flex 1) --- */}
      <View className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200">
        <View className="flex-row bg-gray-800 p-4">
          {[
            { label: "ID", key: "id", flex: 1 },
            { label: "Material Name", key: "name", flex: 2 },
            { label: "Class", key: "class", flex: 1 },
            { label: "UoM", key: "uom", flex: 1 },
            { label: "Total Load", key: "totalLoad", flex: 1 }, // sorting for this might not be needed if always '-', but kept for consistency
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
                  -
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
