import * as ImagePicker from "expo-image-picker"; // Ensure this is installed/imported
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Camera,
  Check,
  ChevronDown,
  Eye,
  Plus,
  ScanLine,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { and, asc, eq, gt, sum } from "drizzle-orm";
import { db } from "../db/client";
import {
  auditTrails,
  inventory,
  inventoryTransactionItems,
  materials,
  paymentMethods,
  transactionItems,
  transactions,
} from "../db/schema";

const { width, height } = Dimensions.get("window");

// --- CUSTOM PICKER COMPONENT ---
const CustomPicker = ({
  selectedValue,
  onValueChange,
  placeholder,
  items,
  theme,
  height = 48, // Default height for consistency
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
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
            height: height,
          },
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
              keyExtractor={(item) => String(item.value)}
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

export default function TransactionSummary() {
  const params = useLocalSearchParams();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f3f4f6",
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937",
    textSecondary: isDark ? "#A1A1AA" : "#4b5563",
    border: isDark ? "#333333" : "#e5e7eb",
    subtleBorder: isDark ? "#2C2C2C" : "#f9fafb",
    inputBg: isDark ? "#2C2C2C" : "#f3f4f6",
    inputText: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#888888" : "#9ca3af",
    rowEven: isDark ? "#1E1E1E" : "#ffffff",
    rowOdd: isDark ? "#252525" : "#f9fafb",
    highlightBg: isDark ? "#1e3a8a" : "#eff6ff",
    headerBg: isDark ? "#0f0f0f" : "#1f2937",
    primary: "#2563eb",
  };

  const transactionId = params.transactionId
    ? Number(params.transactionId)
    : null;

  // Data State
  const [lineItems, setLineItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);

  // Header State
  const [transactionType, setTransactionType] = useState();
  const [paymentMethod, setPaymentMethod] = useState();
  const [clientName, setClientName] = useState("");
  const [clientAffiliation, setClientAffiliation] = useState("");
  const [driverName, setDriverName] = useState("");
  const [truckPlate, setTruckPlate] = useState("");
  const [truckWeight, setTruckWeight] = useState("");
  const [licenseImage, setLicenseImage] = useState(null);

  // Evidence State
  const [evidenceImages, setEvidenceImages] = useState([]);

  // Modals
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [evidenceModalVisible, setEvidenceModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [galleryModalVisible, setGalleryModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Scan State
  const [isScanning, setIsScanning] = useState(false); // To disable button
  const [isPredicting, setIsPredicting] = useState(false); // To show loading overlay

  // Inputs
  const [paidAmountInput, setPaidAmountInput] = useState("");

  // Add/Edit Item State (For Selling Modal)
  const [materialsList, setMaterialsList] = useState([]);
  const [paymentMethodList, setPaymentMethodList] = useState([]);

  // -- Edit Mode State (Selling) --
  const [editingItemId, setEditingItemId] = useState(null);

  const [newItemMaterialId, setNewItemMaterialId] = useState(null);
  const [newItemWeight, setNewItemWeight] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemSubtotal, setNewItemSubtotal] = useState("0.00");
  const [availableStock, setAvailableStock] = useState(0);

  const loadMaterials = async () => {
    const data = await db.select().from(materials);
    setMaterialsList(
      data.map((m) => ({ label: m.name, value: m.id, uom: m.uom })),
    );
  };

  const loadPaymentMethods = async () => {
    try {
      const data = await db.select().from(paymentMethods);
      setPaymentMethodList(
        data.map((pm) => ({ label: pm.name, value: pm.name })),
      );
    } catch (e) {
      console.error("Failed to load payment methods", e);
    }
  };

  const loadTransactionData = async () => {
    if (transactionId) {
      const txHeader = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));
      if (txHeader.length > 0) {
        const h = txHeader[0];
        setTransactionType(h.type);
        setPaymentMethod(h.paymentMethod);
        setClientName(h.clientName || "");
        setClientAffiliation(h.clientAffiliation || "");
        setDriverName(h.driverName || "");
        setTruckPlate(h.truckPlate || "");
        setTruckWeight(h.truckWeight ? String(h.truckWeight) : "");
        setLicenseImage(h.licenseImageUri || null);
      }
      const items = await db
        .select({
          id: transactionItems.id,
          material: materials.name,
          materialId: materials.id,
          weight: transactionItems.weight,
          price: transactionItems.price,
          subtotal: transactionItems.subtotal,
          uom: materials.uom,
        })
        .from(transactionItems)
        .leftJoin(materials, eq(transactionItems.materialId, materials.id))
        .where(eq(transactionItems.transactionId, transactionId));

      setLineItems(items);
    } else {
      setLineItems([]);
      setTransactionType(null);
      setPaymentMethod(null);
      setClientName("");
      setClientAffiliation("");
      setDriverName("");
      setTruckPlate("");
      setTruckWeight("");
      setLicenseImage(null);
      setEvidenceImages([]);
    }
  };

  useEffect(() => {
    const total = lineItems.reduce((sum, item) => {
      const val =
        typeof item.subtotal === "string"
          ? parseFloat(item.subtotal)
          : item.subtotal;
      return sum + (val || 0);
    }, 0);
    setGrandTotal(total);
  }, [lineItems]);

  useFocusEffect(
    useCallback(() => {
      loadMaterials();
      loadPaymentMethods();
      loadTransactionData();
    }, [transactionId]),
  );

  const updateHeader = async (field, value) => {
    if (field === "type") {
      if (value !== transactionType) {
        setTransactionType(value);
        setPaymentMethod(null);
        setClientName("");
        setClientAffiliation("");
        setDriverName("");
        setTruckPlate("");
        setTruckWeight("");
        setLicenseImage(null);
        setLineItems([]);
        setEvidenceImages([]);
      }
    } else if (field === "payment") {
      setPaymentMethod(value);
    }

    if (transactionId) {
      try {
        await db
          .update(transactions)
          .set({
            type: field === "type" ? value : transactionType,
            paymentMethod: field === "payment" ? value : paymentMethod,
          })
          .where(eq(transactions.id, transactionId));
      } catch (e) {
        console.error("Persist failed", e);
      }
    }
  };

  const takeLicensePhoto = async () => {
    const res = await ImagePicker.requestCameraPermissionsAsync();
    if (!res.granted) {
      Alert.alert("Permission Required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) setLicenseImage(result.assets[0].uri);
  };

  const takeEvidencePhoto = async () => {
    const res = await ImagePicker.requestCameraPermissionsAsync();
    if (!res.granted) {
      Alert.alert("Permission Required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) {
      setEvidenceImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeEvidencePhoto = () => {
    Alert.alert("Delete Photo", "Are you sure you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setEvidenceImages((prev) =>
            prev.filter((_, i) => i !== currentImageIndex),
          );
          setGalleryModalVisible(false);
          setCurrentImageIndex(0);
        },
      },
    ]);
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  };

  // --- UPDATED AI SCAN LOGIC ---
  const handleAIScan = async () => {
    if (!materialsList || materialsList.length === 0) {
      Alert.alert("Error", "No materials defined in database.");
      return;
    }

    const res = await ImagePicker.requestCameraPermissionsAsync();
    if (!res.granted) {
      Alert.alert(
        "Permission Required",
        "Camera access is needed for AI scanning.",
      );
      return;
    }

    setIsScanning(true);

    // 1. Open Camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (result.canceled) {
      setIsScanning(false);
      return;
    }

    // 2. Start Prediction Simulation
    setIsPredicting(true);

    setTimeout(() => {
      // 3. Add 2 Random Items
      const newItems = [];
      for (let i = 0; i < 2; i++) {
        const randomMat =
          materialsList[Math.floor(Math.random() * materialsList.length)];
        newItems.push({
          id: Date.now() + i,
          material: randomMat.label,
          materialId: randomMat.value,
          weight: "",
          price: "",
          subtotal: 0,
          uom: randomMat.uom,
        });
      }

      setLineItems((prev) => [...prev, ...newItems]);
      setIsPredicting(false);
      setIsScanning(false);
      // Optional success toast/alert not strictly needed if items just appear
    }, 2500); // 2.5 seconds delay for "Predicting..."
  };

  const handleInlineChange = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item };

        if (field === "materialId") {
          const mat = materialsList.find((m) => m.value === value);
          updated.materialId = value;
          updated.material = mat ? mat.label : "";
          updated.uom = mat ? mat.uom : "";
        } else if (field === "weight") {
          updated.weight = value;
        } else if (field === "price") {
          updated.price = value;
        }

        const w = parseFloat(updated.weight) || 0;
        const p = parseFloat(updated.price) || 0;
        updated.subtotal = w * p;

        return updated;
      }),
    );
  };

  useEffect(() => {
    const checkStock = async () => {
      if (
        addItemModalVisible &&
        newItemMaterialId &&
        transactionType === "Selling"
      ) {
        try {
          const result = await db
            .select({ total: sum(inventory.netWeight) })
            .from(inventory)
            .where(
              and(
                eq(inventory.materialId, newItemMaterialId),
                eq(inventory.status, "In Stock"),
                gt(inventory.netWeight, 0),
              ),
            );
          setAvailableStock(result[0]?.total || 0);
        } catch (e) {
          console.error("Stock check failed", e);
          setAvailableStock(0);
        }
      } else {
        setAvailableStock(0);
      }
    };
    checkStock();
  }, [addItemModalVisible, newItemMaterialId, transactionType]);

  useEffect(() => {
    const w = parseFloat(newItemWeight) || 0;
    const p = parseFloat(newItemPrice) || 0;
    setNewItemSubtotal((w * p).toFixed(2));
  }, [newItemWeight, newItemPrice]);

  const handleAddItem = () => {
    if (!transactionType || !paymentMethod) {
      Alert.alert("Required", "Select Type and Payment Method first.");
      return;
    }

    if (transactionType === "Buying") {
      const newItem = {
        id: Date.now(),
        material: "",
        materialId: null,
        weight: "",
        price: "",
        subtotal: 0,
        uom: "",
      };
      setLineItems([...lineItems, newItem]);
    } else {
      setEditingItemId(null);
      setNewItemMaterialId(null);
      setNewItemWeight("");
      setNewItemPrice("");
      setNewItemSubtotal("0.00");
      setAddItemModalVisible(true);
    }
  };

  const handleEditItem = (item) => {
    if (transactionType === "Selling") {
      setEditingItemId(item.id);
      setNewItemMaterialId(item.materialId);
      setNewItemWeight(String(item.weight));
      setNewItemPrice(String(item.price));
      setNewItemSubtotal(String(item.subtotal));
      setAddItemModalVisible(true);
    }
  };

  const saveItemModal = async () => {
    if (!newItemMaterialId || !newItemWeight || !newItemPrice) {
      Alert.alert("Error", "Fill all fields");
      return;
    }
    const w = parseFloat(newItemWeight);
    const p = parseFloat(newItemPrice);
    const sub = w * p;

    if (transactionType === "Selling" && w > availableStock) {
      Alert.alert(
        "Insufficient Stock",
        `You requested ${w} kg but only ${availableStock} kg is available.`,
      );
      return;
    }

    const mat = materialsList.find((m) => m.value === newItemMaterialId);

    if (transactionId) {
      if (editingItemId) {
        await db
          .update(transactionItems)
          .set({
            materialId: newItemMaterialId,
            weight: w,
            price: p,
            subtotal: sub,
          })
          .where(eq(transactionItems.id, editingItemId));
      } else {
        await db.insert(transactionItems).values({
          transactionId,
          materialId: newItemMaterialId,
          weight: w,
          price: p,
          subtotal: sub,
        });
      }
      loadTransactionData();
    } else {
      if (editingItemId) {
        setLineItems((prev) =>
          prev.map((i) =>
            i.id === editingItemId
              ? {
                  ...i,
                  material: mat.label,
                  materialId: newItemMaterialId,
                  weight: w,
                  price: p,
                  subtotal: sub,
                  uom: mat.uom,
                }
              : i,
          ),
        );
      } else {
        setLineItems((prev) => [
          ...prev,
          {
            id: Date.now(),
            material: mat.label,
            materialId: newItemMaterialId,
            weight: w,
            price: p,
            subtotal: sub,
            uom: mat.uom,
          },
        ]);
      }
    }
    setAddItemModalVisible(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (transactionId) {
      await db.delete(transactionItems).where(eq(transactionItems.id, itemId));
      loadTransactionData();
    } else {
      const newList = lineItems.filter((i) => i.id !== itemId);
      setLineItems(newList);
    }
  };

  const handleDone = () => {
    if (!transactionType || !paymentMethod) {
      Alert.alert("Error", "Select Type & Payment");
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert("Error", "Please add at least one item to the list.");
      return;
    }

    if (transactionType === "Buying") {
      for (const item of lineItems) {
        if (!item.materialId || !item.weight || !item.price) {
          Alert.alert(
            "Missing Data",
            "Please fill in Material, Weight, and Price for all items.",
          );
          return;
        }
      }
    }

    if (!clientName.trim()) {
      Alert.alert("Error", "Client Name required");
      return;
    }
    if (
      transactionType === "Selling" &&
      (!driverName || !truckPlate || !truckWeight || !licenseImage)
    ) {
      Alert.alert("Error", "Logistics required");
      return;
    }

    setEvidenceModalVisible(true);
  };

  const handleProceedToFinish = () => {
    if (evidenceImages.length === 0) {
      Alert.alert(
        "Evidence Required",
        "Please capture at least one evidence photo.",
      );
      return;
    }
    setEvidenceModalVisible(false);
    setPaidAmountInput("");
    setFinishModalVisible(true);
  };

  const confirmFinish = async () => {
    try {
      const finalPaidAmount = parseFloat(paidAmountInput) || 0;
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      let finalTxId = transactionId;

      if (transactionId) {
        await db
          .update(transactions)
          .set({
            totalAmount: grandTotal,
            paidAmount: finalPaidAmount,
            status: "Completed",
            clientName,
            clientAffiliation,
            driverName,
            truckPlate,
            truckWeight: parseFloat(truckWeight),
            licenseImageUri: licenseImage,
          })
          .where(eq(transactions.id, transactionId));

        if (transactionType === "Buying") {
          await db
            .delete(transactionItems)
            .where(eq(transactionItems.transactionId, transactionId));
          for (const item of lineItems) {
            await db.insert(transactionItems).values({
              transactionId,
              materialId: item.materialId,
              weight: parseFloat(item.weight),
              price: parseFloat(item.price),
              subtotal: item.subtotal,
            });
          }
        }
      } else {
        const result = await db
          .insert(transactions)
          .values({
            type: transactionType,
            paymentMethod,
            totalAmount: grandTotal,
            paidAmount: finalPaidAmount,
            status: "Completed",
            date: localDate,
            clientName,
            clientAffiliation: clientAffiliation || null,
            driverName: transactionType === "Selling" ? driverName : null,
            truckPlate: transactionType === "Selling" ? truckPlate : null,
            truckWeight:
              transactionType === "Selling" ? parseFloat(truckWeight) : null,
            licenseImageUri:
              transactionType === "Selling" ? licenseImage : null,
          })
          .returning();

        finalTxId = result[0].id;

        for (const item of lineItems) {
          const itemRes = await db
            .insert(transactionItems)
            .values({
              transactionId: finalTxId,
              materialId: item.materialId,
              weight: parseFloat(item.weight),
              price: parseFloat(item.price),
              subtotal: item.subtotal,
            })
            .returning();
          const newItemId = itemRes[0].id;

          if (transactionType === "Selling") {
            let remainingQty = parseFloat(item.weight);

            const batches = await db
              .select()
              .from(inventory)
              .where(
                and(
                  eq(inventory.materialId, item.materialId),
                  eq(inventory.status, "In Stock"),
                  gt(inventory.netWeight, 0),
                ),
              )
              .orderBy(asc(inventory.date));

            for (const batch of batches) {
              if (remainingQty <= 0) break;

              const take = Math.min(remainingQty, batch.netWeight);
              const newWeight = batch.netWeight - take;

              await db
                .update(inventory)
                .set({
                  netWeight: newWeight,
                  status: newWeight === 0 ? "Depleted" : "In Stock",
                })
                .where(eq(inventory.id, batch.id));

              await db.insert(inventoryTransactionItems).values({
                inventoryId: batch.id,
                transactionItemId: newItemId,
                allocatedWeight: take,
              });

              await db.insert(auditTrails).values({
                inventoryId: batch.id,
                action: "Stock Out",
                notes: `Sold in Tx #${finalTxId}`,
                date: localDate,
                previousWeight: batch.netWeight,
                newWeight: newWeight,
                evidenceImageUri: JSON.stringify(evidenceImages),
              });

              remainingQty -= take;
            }
          }
        }
      }

      setFinishModalVisible(false);
      router.replace({
        pathname: "/transactionDetailed",
        params: { transactionId: finalTxId },
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const renderBuyingRow = ({ item, index }) => (
    <View
      className="flex-row p-2 items-center border-b"
      style={{
        backgroundColor: index % 2 === 0 ? theme.rowEven : theme.rowOdd,
        borderColor: theme.subtleBorder,
      }}
    >
      {/* Material Dropdown - Height 12 (48px) */}
      <View className="flex-[2] pr-1">
        <CustomPicker
          selectedValue={item.materialId}
          onValueChange={(val) =>
            handleInlineChange(item.id, "materialId", val)
          }
          placeholder="Select"
          items={materialsList}
          theme={theme}
          height={48} // Pass height prop
        />
      </View>

      {/* Weight Input - Height 12 (48px) */}
      <View className="flex-1 px-1">
        <TextInput
          value={String(item.weight)}
          onChangeText={(val) => handleInlineChange(item.id, "weight", val)}
          placeholder="Enter Weight"
          placeholderTextColor={theme.placeholder}
          keyboardType="numeric"
          className="border rounded px-1 text-center text-sm h-12"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
            color: theme.inputText,
          }}
        />
      </View>

      {/* Price Input - Height 12 (48px) */}
      <View className="flex-1 px-1">
        <TextInput
          value={String(item.price)}
          onChangeText={(val) => handleInlineChange(item.id, "price", val)}
          placeholder="Enter Price/Unit"
          placeholderTextColor={theme.placeholder}
          keyboardType="numeric"
          className="border rounded px-1 text-center text-sm h-12"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
            color: theme.inputText,
          }}
        />
      </View>

      {/* Subtotal */}
      <View className="flex-[1.2] items-end justify-center pr-2">
        <Text
          className="font-bold text-xs"
          style={{ color: theme.textPrimary }}
        >
          {(item.subtotal || 0).toFixed(2)}
        </Text>
      </View>

      {/* Delete */}
      <Pressable
        onPress={() => handleDeleteItem(item.id)}
        className="w-6 items-center"
      >
        <Trash2 size={18} color="#ef4444" />
      </Pressable>
    </View>
  );

  const renderSellingRow = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => handleEditItem(item)}
      className="flex-row p-3 items-center border-b"
      style={{
        backgroundColor: index % 2 === 0 ? theme.rowEven : theme.rowOdd,
        borderColor: theme.subtleBorder,
      }}
    >
      <View className="flex-[2]">
        <Text
          className="font-bold text-base"
          style={{ color: theme.textPrimary }}
        >
          {item.material}
        </Text>
        <Text className="text-xs" style={{ color: theme.textSecondary }}>
          @{parseFloat(item.price).toFixed(2)}/kg
        </Text>
      </View>
      <Text
        className="flex-1 text-center font-medium"
        style={{ color: theme.textPrimary }}
      >
        {item.weight}
      </Text>
      <Text
        className="flex-1 text-right font-bold"
        style={{ color: theme.textPrimary }}
      >
        {parseFloat(item.subtotal).toFixed(2)}
      </Text>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          handleDeleteItem(item.id);
        }}
        className="w-8 items-end"
      >
        <Trash2 size={20} color="#ef4444" />
      </Pressable>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View
        className="flex-1 p-3 gap-3"
        style={{ backgroundColor: theme.background }}
      >
        {/* HEADER INPUTS */}
        <View
          className="p-3 rounded-lg border gap-3 shadow-sm"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          {/* ... (Existing inputs remain unchanged) ... */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text
                className="text-xs font-bold mb-1 uppercase"
                style={{ color: theme.textSecondary }}
              >
                Type <Text className="text-red-500">*</Text>
              </Text>
              <View className="h-12">
                <CustomPicker
                  selectedValue={transactionType}
                  onValueChange={(v) => updateHeader("type", v)}
                  placeholder="Type"
                  items={[
                    { label: "Buying", value: "Buying" },
                    { label: "Selling", value: "Selling" },
                  ]}
                  theme={theme}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text
                className="text-xs font-bold mb-1 uppercase"
                style={{ color: theme.textSecondary }}
              >
                Payment Method <Text className="text-red-500">*</Text>
              </Text>
              <View className="h-12">
                <CustomPicker
                  selectedValue={paymentMethod}
                  onValueChange={(v) => updateHeader("payment", v)}
                  placeholder="Method"
                  items={paymentMethodList}
                  theme={theme}
                />
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text
                className="text-xs font-bold mb-1 uppercase"
                style={{ color: theme.textSecondary }}
              >
                Client Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                placeholder="Full Name"
                placeholderTextColor={theme.placeholder}
                value={clientName}
                onChangeText={setClientName}
                className="border rounded px-2 h-12 text-base"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                  color: theme.inputText,
                }}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-xs font-bold mb-1 uppercase"
                style={{ color: theme.textSecondary }}
              >
                Affiliation
              </Text>
              <TextInput
                placeholder="Company (Opt)"
                placeholderTextColor={theme.placeholder}
                value={clientAffiliation}
                onChangeText={setClientAffiliation}
                className="border rounded px-2 h-12 text-base"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                  color: theme.inputText,
                }}
              />
            </View>
          </View>

          {transactionType === "Selling" && (
            <>
              <View
                className="flex-row gap-3 pt-2 border-t mt-1"
                style={{ borderTopColor: theme.subtleBorder }}
              >
                <View className="flex-1">
                  <Text className="text-xs font-bold text-orange-600 mb-1 uppercase">
                    Driver <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    placeholder="Driver Name"
                    placeholderTextColor={isDark ? "#fb923c" : "#9ca3af"}
                    value={driverName}
                    onChangeText={setDriverName}
                    className="border border-orange-200 dark:border-orange-900 rounded px-2 h-12 bg-orange-50 dark:bg-orange-950 text-base text-gray-900 dark:text-orange-100"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-orange-600 mb-1 uppercase">
                    Plate # <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    placeholder="ABC-123"
                    placeholderTextColor={isDark ? "#fb923c" : "#9ca3af"}
                    value={truckPlate}
                    onChangeText={setTruckPlate}
                    className="border border-orange-200 dark:border-orange-900 rounded px-2 h-12 bg-orange-50 dark:bg-orange-950 text-base text-gray-900 dark:text-orange-100"
                  />
                </View>
              </View>

              <View className="flex-row gap-3 items-end">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-orange-600 mb-1 uppercase">
                    Truck Weight (kg) <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? "#fb923c" : "#9ca3af"}
                    value={truckWeight}
                    onChangeText={setTruckWeight}
                    className="border border-orange-200 dark:border-orange-900 rounded px-2 h-12 bg-orange-50 dark:bg-orange-950 text-base text-gray-900 dark:text-orange-100"
                  />
                </View>
                <View className="flex-1 flex-row gap-2">
                  <Pressable
                    onPress={takeLicensePhoto}
                    className={`flex-1 h-12 rounded items-center justify-center flex-row gap-1 border ${
                      licenseImage
                        ? "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700"
                        : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <Camera size={18} color={isDark ? "white" : "black"} />
                    <Text className="text-xs font-bold text-black dark:text-white">
                      {licenseImage ? "Retake" : "License *"}
                    </Text>
                  </Pressable>
                  {licenseImage && (
                    <Pressable
                      onPress={() => setPreviewImageUri(licenseImage)}
                      className="w-12 h-12 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded items-center justify-center"
                    >
                      <Eye size={20} color={isDark ? "#93c5fd" : "#2563eb"} />
                    </Pressable>
                  )}
                </View>
              </View>
            </>
          )}
        </View>

        {/* ITEMS LIST */}
        <View
          className="flex-1 rounded-lg border overflow-hidden"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          <View
            className="flex-row p-2 border-b justify-between items-center"
            style={{
              backgroundColor: theme.headerBg,
              borderColor: theme.border,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Text
                className="font-bold"
                style={{ color: theme.textSecondary }}
              >
                Items List
              </Text>
              {transactionType === "Buying" && (
                <Pressable
                  onPress={handleAIScan}
                  disabled={isScanning}
                  className="flex-row bg-purple-600 px-2 py-1 rounded items-center gap-1 active:bg-purple-700"
                >
                  <ScanLine size={14} color="white" />
                  <Text className="text-white text-xs font-bold">AI Scan</Text>
                </Pressable>
              )}
            </View>
            <View className="items-end">
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                Total Amount
              </Text>
              <Text className="font-bold text-blue-700 dark:text-blue-400 text-lg">
                ₱{grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          <View
            className="flex-row p-2 items-center"
            style={{ backgroundColor: theme.rowOdd }}
          >
            <Text
              className="flex-[2] font-bold text-xs uppercase"
              style={{ color: theme.textSecondary }}
            >
              Material
            </Text>
            <Text
              className="flex-1 font-bold text-xs text-center uppercase"
              style={{ color: theme.textSecondary }}
            >
              Weight
            </Text>
            {transactionType === "Buying" && (
              <Text
                className="flex-1 font-bold text-xs text-center uppercase"
                style={{ color: theme.textSecondary }}
              >
                Price/Unit
              </Text>
            )}
            <Text
              className="flex-1 font-bold text-xs text-right uppercase"
              style={{ color: theme.textSecondary }}
            >
              Total
            </Text>
            <View className="w-8" />
          </View>

          <FlatList
            data={lineItems}
            keyExtractor={(item) => String(item.id)}
            renderItem={
              transactionType === "Buying" ? renderBuyingRow : renderSellingRow
            }
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="p-10 items-center justify-center">
                <Text style={{ color: theme.placeholder }}>
                  No items added yet.
                </Text>
              </View>
            }
          />
        </View>

        {/* FOOTER BUTTONS */}
        <View className="flex-row gap-3 pt-2">
          <Pressable
            onPress={handleAddItem}
            className="flex-1 bg-green-600 h-14 rounded-lg flex-row items-center justify-center gap-2 shadow-sm active:bg-green-700"
          >
            <Plus size={24} color="white" />
            <Text className="text-white font-bold text-lg">
              {transactionType === "Buying" ? "Add Row" : "Add Item"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDone}
            className="flex-[2] bg-blue-600 h-14 rounded-lg flex-row items-center justify-center gap-2 shadow-sm active:bg-blue-700"
          >
            <Check size={24} color="white" />
            <Text className="text-white font-bold text-lg">
              Finish Transaction
            </Text>
          </Pressable>
        </View>
      </View>

      {/* --- MODALS --- */}
      {/* 1. Add/Edit Selling Item Modal (unchanged from previous) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addItemModalVisible}
        onRequestClose={() => setAddItemModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAddItemModalVisible(false)}
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
                {editingItemId ? "Edit Item" : "Add Item"}
              </Text>
              <TouchableOpacity onPress={() => setAddItemModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text
                  className="text-xs font-bold mb-1 uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  Material <Text className="text-red-500">*</Text>
                </Text>
                <View className="h-12">
                  <CustomPicker
                    selectedValue={newItemMaterialId}
                    onValueChange={setNewItemMaterialId}
                    placeholder="Select Material"
                    items={materialsList}
                    theme={theme}
                  />
                </View>
                {transactionType === "Selling" && availableStock !== null && (
                  <Text className="text-xs text-blue-500 mt-1">
                    Available Stock: {availableStock} kg
                  </Text>
                )}
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text
                    className="text-xs font-bold mb-1 uppercase"
                    style={{ color: theme.textSecondary }}
                  >
                    Weight (kg) <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="numeric"
                    value={newItemWeight}
                    onChangeText={setNewItemWeight}
                    className="border rounded px-3 h-12 text-lg font-bold"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.inputText,
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-xs font-bold mb-1 uppercase"
                    style={{ color: theme.textSecondary }}
                  >
                    Price / kg <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="numeric"
                    value={newItemPrice}
                    onChangeText={setNewItemPrice}
                    className="border rounded px-3 h-12 text-lg font-bold"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.inputText,
                    }}
                  />
                </View>
              </View>

              <View className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded items-center border border-blue-100 dark:border-blue-900">
                <Text className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase mb-1">
                  Line Total
                </Text>
                <Text className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  ₱{newItemSubtotal}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={saveItemModal}
              className="mt-6 bg-blue-600 p-3 rounded-lg items-center"
            >
              <Text className="text-white font-bold text-lg">
                {editingItemId ? "Update Item" : "Save Item"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 2. Evidence Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={evidenceModalVisible}
        onRequestClose={() => setEvidenceModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEvidenceModalVisible(false)}
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
                Capture Evidence
              </Text>
              <TouchableOpacity onPress={() => setEvidenceModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>
              Please capture at least one photo of the items or transaction as
              audit evidence.
            </Text>

            <TouchableOpacity
              onPress={takeEvidencePhoto}
              className="flex-row items-center justify-center p-4 rounded-lg mb-4 border-2 border-dashed"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.inputBg,
              }}
            >
              <Camera size={24} color={theme.textPrimary} />
              <Text
                className="ml-2 font-bold"
                style={{ color: theme.textPrimary }}
              >
                Add Photo
              </Text>
            </TouchableOpacity>

            {evidenceImages.length > 0 ? (
              <View className="h-32 mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {evidenceImages.map((uri, index) => (
                    <View
                      key={index}
                      style={{
                        marginRight: 12,
                        position: "relative",
                        width: 100,
                        height: 100,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setCurrentImageIndex(index);
                          setGalleryModalVisible(true);
                        }}
                      >
                        <Image
                          source={{ uri }}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 8,
                            backgroundColor: "#e5e5e5",
                          }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View className="h-24 items-center justify-center mb-4">
                <Text className="italic text-red-400">
                  No photos captured yet (Required)
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleProceedToFinish}
              className={`p-4 rounded-lg items-center shadow-sm ${
                evidenceImages.length > 0 ? "bg-blue-600" : "bg-gray-400"
              }`}
            >
              <Text className="text-white font-bold text-lg">Proceed</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 3. Finish Confirm Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={finishModalVisible}
        onRequestClose={() => setFinishModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFinishModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            {/* ... Content same as previous ... */}
            <View
              className="flex-row justify-between items-center mb-4 border-b pb-2"
              style={{ borderBottomColor: theme.border }}
            >
              <Text
                className="text-xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                Confirm Transaction
              </Text>
              <TouchableOpacity onPress={() => setFinishModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="gap-2 mb-4">
              {/* Summary Details */}
              <View className="flex-row justify-between">
                <Text style={{ color: theme.textSecondary }}>Client:</Text>
                <Text
                  className="font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {clientName}
                </Text>
              </View>
              {/* ... Other details ... */}
              <View
                className="flex-row justify-between border-t pt-2 mt-2"
                style={{ borderTopColor: theme.subtleBorder }}
              >
                <Text
                  className="text-lg font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  Grand Total:
                </Text>
                <Text className="text-lg font-bold text-blue-600">
                  ₱{grandTotal.toFixed(2)}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text
                className="text-xs font-bold mb-1 uppercase"
                style={{ color: theme.textSecondary }}
              >
                Initial Payment / Paid Amount
              </Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                value={paidAmountInput}
                onChangeText={setPaidAmountInput}
                className="border rounded px-3 h-12 text-xl font-bold text-green-700"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={confirmFinish}
              className="bg-green-600 p-4 rounded-lg items-center shadow-sm"
            >
              <Text className="text-white font-bold text-lg">
                Confirm & Save
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- PREDICTING OVERLAY --- */}
      <Modal animationType="fade" transparent={true} visible={isPredicting}>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.8)" }]}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white text-xl font-bold mt-4">
            Predicting...
          </Text>
        </View>
      </Modal>

      {/* --- IMAGE & GALLERY MODALS --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!previewImageUri}
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.imageModalClose}
            onPress={() => setPreviewImageUri(null)}
          >
            <X size={30} color="white" />
          </Pressable>
          {previewImageUri && (
            <Image
              source={{ uri: previewImageUri }}
              style={{ width: "90%", height: "70%", borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={galleryModalVisible}
        transparent={true}
        onRequestClose={() => setGalleryModalVisible(false)}
      >
        <View className="flex-1 bg-black justify-between">
          <TouchableOpacity
            onPress={() => setGalleryModalVisible(false)}
            className="absolute top-12 right-6 z-50 p-2 bg-gray-800 rounded-full"
          >
            <X size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-1 justify-center items-center">
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              contentOffset={{ x: currentImageIndex * width, y: 0 }}
            >
              {evidenceImages.map((uri, index) => (
                <View
                  key={index}
                  style={{
                    width,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={{ uri }}
                    style={{ width: width, height: "80%" }}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <View className="w-full px-6 pb-10 gap-4 items-center bg-black/50 pt-4">
            <Text className="text-white font-bold text-lg">
              {currentImageIndex + 1} / {evidenceImages.length}
            </Text>

            <TouchableOpacity
              onPress={removeEvidencePhoto}
              className="bg-red-600 w-full py-4 rounded-lg flex-row justify-center items-center gap-2"
            >
              <Trash2 size={20} color="white" />
              <Text className="text-white font-bold text-lg">Delete Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    // height handled via prop or inline style
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
  },
  modalContent: {
    width: "40%",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  imageModalClose: {
    position: "absolute",
    top: 40,
    right: 30,
    padding: 10,
  },
});
