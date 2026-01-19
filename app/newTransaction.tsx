import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// --- DATABASE IMPORTS ---
import { and, asc, eq, sql } from "drizzle-orm";
import {
    inventory,
    inventoryTransactionItems,
    materials,
    transactionItems,
    transactions,
} from "../db/schema";
import { db } from "./_layout";

export default function NewTransaction() {
  const params = useLocalSearchParams();
  const transactionIdParam = params.transactionId
    ? Number(params.transactionId)
    : null;
  const itemIdParam = params.itemId ? Number(params.itemId) : null;

  const [materialsList, setMaterialsList] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState();
  const [stockMap, setStockMap] = useState({});
  const [transactionType, setTransactionType] = useState(null);

  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [subtotal, setSubtotal] = useState("0.00");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    loadData();
    if (itemIdParam) loadExistingItem(itemIdParam);
  }, []);

  useEffect(() => {
    const w = parseFloat(weight) || 0;
    const p = parseFloat(price) || 0;
    setSubtotal((w * p).toFixed(2));
  }, [weight, price]);

  // --- HELPER FOR NUMERIC INPUT ---
  const handleNumericInput = (text, setter) => {
    // Regex allows: empty string, digits, or digits with a single decimal point
    if (text === "" || /^\d*\.?\d*$/.test(text)) {
      setter(text);
    }
  };

  const loadData = async () => {
    try {
      // --- GENTLE SELF-HEAL ---
      // Only fix batches that are 'In Stock' but somehow have 0 weight
      // This prevents "Available: 0" when data actually exists, without resetting valid sales.
      const zeroBatches = await db
        .select()
        .from(inventory)
        .where(
          and(eq(inventory.status, "In Stock"), eq(inventory.netWeight, 0)),
        );

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

      // 1. Get Transaction Type
      if (transactionIdParam) {
        const tx = await db
          .select()
          .from(transactions)
          .where(eq(transactions.id, transactionIdParam));
        if (tx.length > 0) setTransactionType(tx[0].type);
      }

      // 2. Get Materials
      const allMaterials = await db.select().from(materials);

      // 3. Get Stock Levels (Sum of 'In Stock' Inventory Net Weight)
      const stockLevels = await db
        .select({
          materialId: inventory.materialId,
          totalWeight: sql`sum(${inventory.netWeight})`,
        })
        .from(inventory)
        .where(eq(inventory.status, "In Stock"))
        .groupBy(inventory.materialId);

      // Create a map for easy lookup
      const stockMapping = {};
      stockLevels.forEach((s) => {
        stockMapping[s.materialId] = s.totalWeight;
      });
      setStockMap(stockMapping);

      // 4. Format List for Dropdown
      const formattedList = allMaterials.map((m) => {
        const avail = stockMapping[m.id] || 0;
        return {
          label: `${m.name} (Avail: ${avail.toFixed(2)} ${m.uom || "kg"})`,
          value: m.id,
          available: avail,
        };
      });
      setMaterialsList(formattedList);
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  const loadExistingItem = async (id) => {
    const item = await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.id, id));
    if (item.length > 0) {
      const i = item[0];
      setSelectedMaterial(i.materialId);
      setWeight(i.weight.toString());
      setPrice(i.price.toString());
    }
  };

  const handleSubmit = async () => {
    if (!selectedMaterial || !weight || !price) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const weightVal = parseFloat(weight);

    // --- INVENTORY CHECK & DEDUCTION (If Selling) ---
    if (transactionType === "Selling") {
      const available = stockMap[selectedMaterial] || 0;

      if (weightVal > available) {
        Alert.alert(
          "Insufficient Stock",
          `You only have ${available.toFixed(2)} available for this material.`,
        );
        return;
      }

      try {
        // Perform FIFO Deduction
        let remainingToDeduct = weightVal;

        const batches = await db
          .select()
          .from(inventory)
          .where(
            and(
              eq(inventory.materialId, selectedMaterial),
              eq(inventory.status, "In Stock"),
            ),
          )
          .orderBy(asc(inventory.date)); // Oldest First

        for (const batch of batches) {
          if (remainingToDeduct <= 0.001) break;

          if (batch.netWeight <= 0) continue;

          if (batch.netWeight <= remainingToDeduct) {
            // Consume entire batch
            remainingToDeduct -= batch.netWeight;
            await db
              .update(inventory)
              .set({ netWeight: 0, status: "Sold" })
              .where(eq(inventory.id, batch.id));
          } else {
            // Partial consumption
            const newWeight = batch.netWeight - remainingToDeduct;
            await db
              .update(inventory)
              .set({ netWeight: newWeight })
              .where(eq(inventory.id, batch.id));
            remainingToDeduct = 0;
          }
        }
      } catch (error) {
        console.error("Deduction Error", error);
        Alert.alert("Error", "Failed to update inventory.");
        return;
      }
    }

    // --- SAVE TRANSACTION ITEM ---
    try {
      if (!transactionIdParam) {
        Alert.alert("Error", "No Transaction ID found");
        return;
      }

      if (itemIdParam) {
        await db
          .update(transactionItems)
          .set({
            materialId: selectedMaterial,
            weight: weightVal,
            price: parseFloat(price),
            subtotal: parseFloat(subtotal),
          })
          .where(eq(transactionItems.id, itemIdParam));
      } else {
        await db.insert(transactionItems).values({
          transactionId: transactionIdParam,
          materialId: selectedMaterial,
          weight: weightVal,
          price: parseFloat(price),
          subtotal: parseFloat(subtotal),
        });
      }

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Database Error", error.message);
    }
  };

  const truncate = (str, n) =>
    str?.length > n ? str.substr(0, n - 1) + "..." : str;

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <View className="flex-1 flex-col gap-4">
        <View className="flex-[3] gap-4 px-10 pt-10">
          <Text className="font-bold w-full text-center text-3xl mb-4">
            {itemIdParam ? "Edit Line Item" : "New Transaction Line Item"}
          </Text>

          <View>
            <Text className="text-lg font-semibold mb-2 ml-1">Material</Text>
            <View
              style={[
                styles.pickerContainer,
                isFocused && styles.pickerFocused,
              ]}
            >
              <View style={styles.visualContainer}>
                <Text
                  style={[
                    styles.pickerText,
                    !selectedMaterial && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedMaterial
                    ? materialsList.find((i) => i.value === selectedMaterial)
                        ?.label
                    : "Select Material..."}
                </Text>
                <View style={styles.arrowContainer}>
                  <View
                    style={[styles.roundedArrow, isFocused && styles.arrowOpen]}
                  />
                </View>
              </View>
              <Picker
                selectedValue={selectedMaterial}
                onValueChange={(v) => {
                  setSelectedMaterial(v);
                  setIsFocused(false);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={styles.invisiblePicker}
              >
                <Picker.Item
                  label="Select Material..."
                  value={null}
                  enabled={false}
                />
                {materialsList.map((m, i) => (
                  <Picker.Item
                    key={i}
                    label={truncate(m.label, 30)}
                    value={m.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-lg font-semibold mb-2 ml-1">
                Weight
              </Text>
              <TextInput
                className="bg-white rounded-md px-4 h-16 border border-gray-300 text-xl"
                placeholder="0.0"
                keyboardType="numeric"
                value={weight}
                onChangeText={(text) => handleNumericInput(text, setWeight)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold mb-2 ml-1">
                Price / Unit
              </Text>
              <TextInput
                className="bg-white rounded-md px-4 h-16 border border-gray-300 text-xl"
                placeholder="0.00"
                keyboardType="numeric"
                value={price}
                onChangeText={(text) => handleNumericInput(text, setPrice)}
              />
            </View>
          </View>

          <View>
            <Text className="text-lg font-semibold mb-2 ml-1">Subtotal</Text>
            <View className="bg-gray-200 rounded-md px-4 h-16 border border-gray-300 justify-center">
              <Text className="text-2xl font-bold text-gray-600">
                ₱ {subtotal}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4 mt-6">
            <Pressable
              onPress={() => router.back()}
              className="flex-1 bg-red-600 h-16 rounded-lg items-center justify-center"
            >
              <Text className="text-white font-bold text-xl">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              className="flex-1 bg-green-600 h-16 rounded-lg items-center justify-center"
            >
              <Text className="text-white font-bold text-xl">Submit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    height: 64,
    backgroundColor: "white",
    borderRadius: 6,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    width: "100%",
    borderWidth: 2,
    borderColor: "gray",
  },
  pickerFocused: { borderColor: "#F2C94C" },
  visualContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: "100%",
    width: "100%",
  },
  pickerText: { fontSize: 20, color: "black", flex: 1 },
  placeholderText: { color: "#9ca3af" },
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
});
