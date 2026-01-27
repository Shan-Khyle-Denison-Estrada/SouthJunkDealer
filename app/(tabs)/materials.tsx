import { useFocusEffect } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Trash2,
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
import { desc, eq, sql } from "drizzle-orm";
// Added unitOfMeasurements to imports
import { db } from "../../db/client";
import {
  inventory,
  materials,
  transactionItems,
  unitOfMeasurements,
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
              keyExtractor={(item) => item.value}
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

export default function MaterialIndex() {
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
    inputBg: isDark ? "#2C2C2C" : "#f3f4f6",
    inputText: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    highlightBg: isDark ? "#1e3a8a" : "#eff6ff", // Blue-900 : Blue-50
    headerBg: isDark ? "#0f0f0f" : "#1f2937",
    primary: "#2563eb",
  };

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

  // --- DYNAMIC DATA OPTIONS ---
  const [uomOptions, setUomOptions] = useState([]); // State for dynamic UoM options

  const classOptions = [
    { label: "Class A (High Value)", value: "A" },
    { label: "Class B (Mid Value)", value: "B" },
    { label: "Class C (Low Value)", value: "C" },
  ];

  // --- DATA FETCHING ---
  const loadData = async () => {
    try {
      // 1. Fetch Materials
      const matData = await db
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

      setMaterialsData(matData);

      // 2. Fetch Unit of Measurements (NEW)
      const uomData = await db.select().from(unitOfMeasurements);

      // Map DB data to Picker format: { label: "Kilograms (kg)", value: "kg" }
      const formattedUoms = uomData.map((item) => ({
        label: `${item.name} (${item.unit})`,
        value: item.unit,
      }));

      setUomOptions(formattedUoms);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load materials or settings");
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
    <View
      className="flex-1 p-4 gap-4"
      style={{ backgroundColor: theme.background }}
    >
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
                New Material
              </Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textSecondary }}
                >
                  Material Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="rounded-md px-3 h-12 border"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.inputText,
                  }}
                  placeholder="Ex: Copper Wire"
                  placeholderTextColor={theme.placeholder}
                  value={materialName}
                  onChangeText={setMaterialName}
                />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text
                    className="font-bold mb-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Class (Optional)
                  </Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={materialClass}
                      onValueChange={setMaterialClass}
                      placeholder="Select..."
                      items={classOptions}
                      theme={theme}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text
                    className="font-bold mb-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Unit of Measurement <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={uom}
                      onValueChange={setUom}
                      placeholder="Select..."
                      items={uomOptions}
                      theme={theme}
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
                Edit Material: {selectedMaterial?.id}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.textSecondary }}
                >
                  Material Name
                </Text>
                <TextInput
                  className="rounded-md px-3 h-12 border"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                    color: theme.inputText,
                  }}
                  value={materialName}
                  onChangeText={setMaterialName}
                />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text
                    className="font-bold mb-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Class (Optional)
                  </Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={materialClass}
                      onValueChange={setMaterialClass}
                      placeholder="Select..."
                      items={classOptions}
                      theme={theme}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text
                    className="font-bold mb-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Unit of Measurement
                  </Text>
                  <View className="h-12">
                    <CustomPicker
                      selectedValue={uom}
                      onValueChange={setUom}
                      placeholder="Select..."
                      items={uomOptions}
                      theme={theme}
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
        <View
          className="flex-1 h-full flex-row items-center rounded-md px-3 border"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
          }}
        >
          <Search size={24} color={theme.placeholder} />
          <TextInput
            placeholder="Search Material..."
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
              selectedClasses.length > 0 || selectedUoms.length > 0
                ? theme.highlightBg
                : theme.card,
            borderColor:
              selectedClasses.length > 0 || selectedUoms.length > 0
                ? theme.primary
                : theme.border,
          }}
        >
          <Filter
            size={24}
            color={
              selectedClasses.length > 0 || selectedUoms.length > 0
                ? theme.primary
                : theme.textSecondary
            }
          />
        </Pressable>

        <Pressable
          className="h-full flex-row items-center justify-center rounded-md px-4 active:opacity-80"
          style={{ backgroundColor: "#F2C94C" }}
          onPress={() => {
            resetForm();
            setAddModalVisible(true);
          }}
        >
          <Plus size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">
            New Material
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
            <Text style={{ color: theme.textSecondary }}>
              No materials found.
            </Text>
            {materialsData.length === 0 ? (
              <Text
                style={{
                  color: theme.placeholder,
                  fontSize: 12,
                  marginTop: 5,
                }}
              >
                Try adding a new material.
              </Text>
            ) : (
              <Text
                style={{
                  color: theme.placeholder,
                  fontSize: 12,
                  marginTop: 5,
                }}
              >
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
                  {item.id}
                </Text>
                <Text
                  className="flex-[2] text-center text-lg"
                  style={{ color: theme.textSecondary }}
                >
                  {item.name}
                </Text>
                <Text
                  className="flex-1 text-center text-lg"
                  style={{ color: theme.textSecondary }}
                >
                  {item.class}
                </Text>
                <Text
                  className="flex-1 text-center text-lg"
                  style={{ color: theme.textSecondary }}
                >
                  {item.uom}
                </Text>
                <Text
                  className="flex-1 text-blue-700 text-center text-lg font-bold"
                  style={{ color: theme.primary }}
                >
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
                Filter Materials
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Filter Section: Class */}
            <View className="mt-4">
              <Text
                className="font-bold mb-2"
                style={{ color: theme.textSecondary }}
              >
                Class
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueClasses.map((cls) => (
                  <TouchableOpacity
                    key={cls}
                    onPress={() =>
                      toggleSelection(selectedClasses, setSelectedClasses, cls)
                    }
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: selectedClasses.includes(cls)
                        ? theme.highlightBg
                        : theme.background,
                      borderColor: selectedClasses.includes(cls)
                        ? theme.primary
                        : theme.border,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedClasses.includes(cls)
                          ? theme.primary
                          : theme.textSecondary,
                        fontWeight: selectedClasses.includes(cls)
                          ? "bold"
                          : "normal",
                      }}
                    >
                      {cls}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter Section: UoM */}
            <View className="mt-4">
              <Text
                className="font-bold mb-2"
                style={{ color: theme.textSecondary }}
              >
                Unit of Measure (UoM)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {uniqueUoms.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() =>
                      toggleSelection(selectedUoms, setSelectedUoms, unit)
                    }
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: selectedUoms.includes(unit)
                        ? theme.highlightBg
                        : theme.background,
                      borderColor: selectedUoms.includes(unit)
                        ? theme.primary
                        : theme.border,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedUoms.includes(unit)
                          ? theme.primary
                          : theme.textSecondary,
                        fontWeight: selectedUoms.includes(unit)
                          ? "bold"
                          : "normal",
                      }}
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
