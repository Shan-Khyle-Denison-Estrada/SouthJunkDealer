import { useFocusEffect } from "expo-router";
import { Download, XCircle } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
// FIX: Import from 'legacy' to avoid deprecation errors in SDK 52+
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// --- DATABASE IMPORTS ---
import { desc, eq, gte, sql } from "drizzle-orm";
import {
  inventory,
  inventoryTransactionItems,
  materials,
  transactionItems,
  transactions,
} from "../../db/schema";
import { db } from "./_layout";

export default function Index() {
  const [unallocatedItems, setUnallocatedItems] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [todaysMetrics, setTodaysMetrics] = useState({
    revenue: 0,
    expenditure: 0,
    profit: 0,
  });

  const [chartAreaDimensions, setChartAreaDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [lineGraphDimensions, setLineGraphDimensions] = useState({
    width: 0,
    height: 0,
  });

  // --- MODAL STATE ---
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // --- DATA LOADING ---
  const loadDashboardData = async () => {
    try {
      // 1. Load Unallocated Buying Items
      const unallocatedResult = await db
        .select({
          lineId: transactionItems.id,
          txId: transactions.id,
          date: transactions.date,
          material: materials.name,
          uom: materials.uom,
          originalWeight: transactionItems.weight,
          totalAllocated: sql`COALESCE(SUM(${inventoryTransactionItems.allocatedWeight}), 0)`,
        })
        .from(transactionItems)
        .leftJoin(
          transactions,
          eq(transactionItems.transactionId, transactions.id),
        )
        .leftJoin(materials, eq(transactionItems.materialId, materials.id))
        .leftJoin(
          inventoryTransactionItems,
          eq(inventoryTransactionItems.transactionItemId, transactionItems.id),
        )
        .where(eq(transactions.type, "Buying"))
        .groupBy(transactionItems.id)
        .having(
          sql`(${transactionItems.weight} - COALESCE(SUM(${inventoryTransactionItems.allocatedWeight}), 0)) > 0.01`,
        )
        .orderBy(desc(transactions.date));

      setUnallocatedItems(unallocatedResult);

      // 2. Load Current Stock Levels
      const stockResult = await db
        .select({
          name: materials.name,
          totalWeight: sql`COALESCE(SUM(${inventory.netWeight}), 0)`,
          uom: materials.uom,
        })
        .from(inventory)
        .leftJoin(materials, eq(inventory.materialId, materials.id))
        .where(eq(inventory.status, "In Stock"))
        .groupBy(materials.name, materials.uom);

      setStockData(stockResult);

      // 3. Load Last 7 Days PROFIT
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split("T")[0];

      const rawTxns = await db
        .select({
          date: transactions.date,
          type: transactions.type,
          amount: transactions.totalAmount,
        })
        .from(transactions)
        .where(gte(transactions.date, dateStr))
        .orderBy(desc(transactions.date));

      const profitMap = {};

      rawTxns.forEach((txn) => {
        if (!txn.date) return;
        const val = parseFloat(txn.amount || 0);

        if (!profitMap[txn.date]) profitMap[txn.date] = 0;

        if (txn.type === "Selling") {
          profitMap[txn.date] += val;
        } else if (txn.type === "Buying") {
          profitMap[txn.date] -= val;
        }
      });

      const profitArray = Object.keys(profitMap)
        .map((date) => ({ date, dailyProfit: profitMap[date] }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7)
        .reverse();

      setProfitData(profitArray);

      // 4. Load Today's Metrics
      const todayIsoStr = new Date().toISOString().split("T")[0];

      const todayTxns = await db
        .select({
          type: transactions.type,
          amount: transactions.totalAmount,
        })
        .from(transactions)
        .where(eq(transactions.date, todayIsoStr));

      let rev = 0;
      let exp = 0;
      todayTxns.forEach((t) => {
        if (t.type === "Selling") rev += t.amount || 0;
        if (t.type === "Buying") exp += t.amount || 0;
      });

      setTodaysMetrics({
        revenue: rev,
        expenditure: exp,
        profit: rev - exp,
      });
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

  // --- EXPORT FUNCTIONALITY ---
  const handleExport = async () => {
    try {
      // 1. Check Availability
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        setErrorMessage(
          "External storage or sharing capabilities are not detected on this device.",
        );
        setErrorModalVisible(true);
        return;
      }

      // 2. Fetch All Data
      const allData = await db
        .select({
          txId: transactions.id,
          date: transactions.date,
          type: transactions.type,
          payment: transactions.paymentMethod,
          status: transactions.status,
          material: materials.name,
          weight: transactionItems.weight,
          price: transactionItems.price,
          subtotal: transactionItems.subtotal,
        })
        .from(transactionItems)
        .leftJoin(
          transactions,
          eq(transactionItems.transactionId, transactions.id),
        )
        .leftJoin(materials, eq(transactionItems.materialId, materials.id))
        .orderBy(desc(transactions.date));

      if (allData.length === 0) {
        Alert.alert("No Data", "There are no transactions to export.");
        return;
      }

      // 3. Generate CSV String
      const headers =
        "Transaction ID,Date,Type,Payment Method,Status,Material,Weight,Price,Subtotal\n";
      const rows = allData
        .map(
          (d) =>
            `${d.txId},${d.date},${d.type},${d.payment},${d.status},${d.material},${d.weight},${d.price},${d.subtotal}`,
        )
        .join("\n");

      const csvContent = headers + rows;

      // 4. Write to File using LEGACY FileSystem API
      const fileUri = FileSystem.documentDirectory + "transactions_export.csv";

      // Use string 'utf8' to avoid enum type errors
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: "utf8",
      });

      // 5. Share
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error("Export failed", error);
      setErrorMessage(
        "An unexpected error occurred while trying to export data. " +
          error.message,
      );
      setErrorModalVisible(true);
    }
  };

  // --- BAR CHART ---
  const renderBarChart = () => {
    if (
      !stockData ||
      stockData.length === 0 ||
      chartAreaDimensions.height === 0
    ) {
      return (
        <View className="flex-1 justify-center items-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Text className="text-gray-400 text-sm">No stock data available</Text>
        </View>
      );
    }

    const { width: containerWidth, height: containerHeight } =
      chartAreaDimensions;
    const PADDING_TOP = 20;
    const PADDING_BOTTOM = 30;
    const GRAPH_HEIGHT = containerHeight - PADDING_TOP - PADDING_BOTTOM;
    const BAR_WIDTH = 40;
    const BAR_GAP = 30;
    const ITEM_WIDTH = BAR_WIDTH + BAR_GAP;

    const maxValue = Math.max(...stockData.map((d) => d.totalWeight), 1);
    const gridMax = Math.ceil(maxValue / 10) * 10;
    const scrollWidth = Math.max(
      containerWidth,
      stockData.length * ITEM_WIDTH + BAR_GAP,
    );
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(gridMax * t));

    return (
      <View className="flex-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Svg width={scrollWidth} height={containerHeight}>
            {ticks.map((tick, i) => {
              const y =
                PADDING_TOP + GRAPH_HEIGHT - (tick / gridMax) * GRAPH_HEIGHT;
              return (
                <Line
                  key={`grid-${i}`}
                  x1="0"
                  y1={y}
                  x2={scrollWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4, 4"
                />
              );
            })}
            {stockData.map((item, index) => {
              const barHeight = (item.totalWeight / gridMax) * GRAPH_HEIGHT;
              const x = index * ITEM_WIDTH + BAR_GAP / 2;
              const y = PADDING_TOP + GRAPH_HEIGHT - barHeight;
              const labelName = item.name || "Unknown";
              return (
                <React.Fragment key={index}>
                  <Rect
                    x={x}
                    y={y}
                    width={BAR_WIDTH}
                    height={barHeight}
                    fill="#3b82f6"
                    rx="4"
                  />
                  <SvgText
                    x={x + BAR_WIDTH / 2}
                    y={y - 6}
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {Math.round(item.totalWeight)}
                  </SvgText>
                  <SvgText
                    x={x + BAR_WIDTH / 2}
                    y={containerHeight - 5}
                    fontSize="11"
                    fill="#374151"
                    textAnchor="middle"
                  >
                    {labelName.length > 8
                      ? labelName.substring(0, 8) + "."
                      : labelName}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </ScrollView>
      </View>
    );
  };

  // --- HELPER FOR CURVED LINES ---
  const createSmoothPath = (points) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      const controlPointX1 = current.x + (next.x - current.x) * 0.2;
      const controlPointY1 = current.y;
      const controlPointX2 = next.x - (next.x - current.x) * 0.2;
      const controlPointY2 = next.y;

      path += ` C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  // --- LINE GRAPH ---
  const renderLineGraph = () => {
    if (
      !profitData ||
      profitData.length === 0 ||
      lineGraphDimensions.height === 0
    ) {
      return (
        <View className="flex-1 justify-center items-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Text className="text-gray-400 text-sm">No transaction data</Text>
        </View>
      );
    }

    const { width, height } = lineGraphDimensions;
    const PADDING = 40;
    const graphWidth = width - PADDING * 2;
    const graphHeight = height - PADDING * 2;

    const dataValues = profitData.map((d) => d.dailyProfit);
    const maxVal = Math.max(...dataValues);
    const minVal = Math.min(...dataValues);

    const range = maxVal - minVal === 0 ? maxVal || 100 : maxVal - minVal;
    const scaleMin = minVal - range * 0.1;
    const scaleMax = maxVal + range * 0.1;
    const scaleRange = scaleMax - scaleMin;

    const points = profitData.map((item, index) => {
      const x = PADDING + index * (graphWidth / (profitData.length - 1 || 1));
      const y =
        height -
        PADDING -
        ((item.dailyProfit - scaleMin) / scaleRange) * graphHeight;
      return { x, y, ...item };
    });

    const pathD = createSmoothPath(points);

    return (
      <Svg width={width} height={height}>
        {/* Axes */}
        <Line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={height - PADDING}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        <Line
          x1={PADDING}
          y1={height - PADDING}
          x2={width - PADDING}
          y2={height - PADDING}
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {/* Curved Line */}
        {points.length > 1 && (
          <Path d={pathD} fill="none" stroke="#F2C94C" strokeWidth="3" />
        )}

        {/* Points & Labels */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.y} r="4" fill="#F2C94C" />

            {/* Profit Label */}
            <SvgText
              x={p.x}
              y={p.y - 12}
              fontSize="10"
              fill="#B45309"
              textAnchor="middle"
              fontWeight="bold"
            >
              {Math.round(p.dailyProfit).toLocaleString()}
            </SvgText>

            <SvgText
              x={p.x}
              y={height - 10}
              fontSize="9"
              fill="#6b7280"
              textAnchor="middle"
            >
              {new Date(p.date).toLocaleDateString("en-US", {
                year: "2-digit",
                month: "short",
                day: "numeric",
              })}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 p-4 gap-4">
      {/* --- CARDS LAYER --- */}
      <View className="flex-row gap-3 h-24">
        {/* Revenue Card */}
        <View className="flex-1 bg-white rounded-2xl p-2 justify-center items-center shadow-sm">
          <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
            Revenue Today
          </Text>
          <Text
            className="text-2xl font-bold text-green-600 mt-1"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            ₱{todaysMetrics.revenue.toLocaleString()}
          </Text>
        </View>

        {/* Buying Card */}
        <View className="flex-1 bg-white rounded-2xl p-2 justify-center items-center shadow-sm">
          <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
            Buying Today
          </Text>
          <Text
            className="text-2xl font-bold text-red-500 mt-1"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            ₱{todaysMetrics.expenditure.toLocaleString()}
          </Text>
        </View>

        {/* Profit Card */}
        <View className="flex-1 bg-white rounded-2xl p-2 justify-center items-center shadow-sm">
          <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
            Profit Today
          </Text>
          <Text
            className={`text-2xl font-bold mt-1 ${todaysMetrics.profit >= 0 ? "text-blue-600" : "text-orange-500"}`}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            ₱{todaysMetrics.profit.toLocaleString()}
          </Text>
        </View>

        {/* Export Button */}
        <Pressable
          onPress={handleExport}
          className="flex-1 bg-primary rounded-2xl justify-center items-center shadow-sm active:bg-amber-600"
        >
          <Download color="white" size={28} />
          <Text className="text-white text-xl font-bold mt-1">Export</Text>
        </Pressable>
      </View>

      {/* --- GRAPHS SECTION --- */}
      <View className="flex-1 flex-row gap-4">
        {/* LEFT: CURRENT STOCK */}
        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm overflow-hidden">
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Current Stock Levels
          </Text>
          <View
            className="flex-1"
            onLayout={(e) => setChartAreaDimensions(e.nativeEvent.layout)}
          >
            {renderBarChart()}
          </View>
        </View>

        {/* RIGHT: PROFIT TREND */}
        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm overflow-hidden">
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Profit Trend (Php)
          </Text>
          <View
            className="flex-1"
            onLayout={(e) => setLineGraphDimensions(e.nativeEvent.layout)}
          >
            {renderLineGraph()}
          </View>
        </View>
      </View>

      {/* --- UNALLOCATED TABLE --- */}
      <View className="flex-1 bg-white rounded-2xl p-2 shadow-sm">
        <Text className="text-xl font-bold text-gray-800 mb-4 px-2 pt-2">
          Pending Inventory (Unallocated Stock)
        </Text>
        <View className="flex-row border-b border-gray-200 pb-3 mb-2 bg-gray-50 p-3 rounded-t-md">
          <Text className="flex-1 font-bold text-gray-600 text-sm">TX ID</Text>
          <Text className="flex-1 font-bold text-gray-600 text-sm">
            LINE ID
          </Text>
          <Text className="flex-[2] font-bold text-gray-600 text-sm">
            MATERIAL
          </Text>
          <Text className="flex-[1.5] font-bold text-gray-600 text-sm text-right">
            UNALLOCATED
          </Text>
          <Text className="flex-[1.5] font-bold text-gray-600 text-sm text-center">
            DATE
          </Text>
        </View>

        {unallocatedItems.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-400 text-base">
              All stock has been assigned.
            </Text>
          </View>
        ) : (
          <FlatList
            data={unallocatedItems}
            keyExtractor={(item) => item.lineId.toString()}
            showsVerticalScrollIndicator={true}
            renderItem={({ item, index }) => {
              const remaining = item.originalWeight - item.totalAllocated;
              return (
                <View
                  className={`flex-row border-b border-gray-50 py-4 px-3 items-center ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <Text className="flex-1 text-gray-700 font-medium text-sm">
                    #{item.txId}
                  </Text>
                  <Text className="flex-1 text-gray-700 font-medium text-sm">
                    #{item.lineId}
                  </Text>
                  <Text className="flex-[2] text-gray-900 font-bold text-sm">
                    {item.material}
                  </Text>
                  <Text className="flex-[1.5] text-blue-700 font-bold text-sm text-right">
                    {remaining.toFixed(2)} {item.uom}
                  </Text>
                  <Text className="flex-[1.5] text-gray-600 text-sm text-center">
                    {item.date}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* --- STORAGE / ERROR MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-[80%] bg-white rounded-2xl p-6 items-center shadow-lg">
            <XCircle size={50} color="#EF4444" style={{ marginBottom: 15 }} />
            <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
              Export Failed
            </Text>
            <Text className="text-gray-600 text-center mb-6 leading-5">
              {errorMessage}
            </Text>
            <Pressable
              onPress={() => setErrorModalVisible(false)}
              className="bg-gray-800 px-8 py-3 rounded-full"
            >
              <Text className="text-white font-bold">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
