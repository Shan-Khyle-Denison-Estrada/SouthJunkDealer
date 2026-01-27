import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
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
  useColorScheme,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

// --- DATABASE IMPORTS ---
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../../db/client";
import {
  inventory,
  inventoryTransactionItems,
  materials,
  transactionItems,
  transactions,
} from "../../db/schema";

export default function Index() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // --- THEME CONFIGURATION ---
  const theme = {
    background: isDark ? "#121212" : "#f9fafb", // Gray-50 equivalent
    card: isDark ? "#1E1E1E" : "#ffffff",
    textPrimary: isDark ? "#FFFFFF" : "#1f2937", // Gray-800
    textSecondary: isDark ? "#A1A1AA" : "#6b7280", // Gray-500/600
    border: isDark ? "#333333" : "#e5e7eb",
    subtleBg: isDark ? "#2C2C2C" : "#f9fafb",
    chartGrid: isDark ? "#444444" : "#e5e7eb",
    chartText: isDark ? "#888888" : "#6b7280",
    success: "#16a34a",
    danger: "#dc2626",
    primary: "#F2C94C",
  };

  const [unallocatedItems, setUnallocatedItems] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [todaysMetrics, setTodaysMetrics] = useState({
    revenue: 0,
    expenditure: 0,
    profit: 0,
  });

  // --- TIMEFRAME STATE ---
  const [timeframe, setTimeframe] = useState("7d");

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
      // 1. Unallocated Items
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

      // 2. Stock Levels
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

      // 3. PROFIT (Dynamic Timeframe)
      const startDate = new Date();
      switch (timeframe) {
        case "1m":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3m":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "6m":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "7d":
        default:
          startDate.setDate(startDate.getDate() - 7);
          break;
      }

      const localStartDate = new Date(
        startDate.getTime() - startDate.getTimezoneOffset() * 60000,
      );
      const dateStr = localStartDate.toISOString().split("T")[0];

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
        if (txn.type === "Selling") profitMap[txn.date] += val;
        else if (txn.type === "Buying") profitMap[txn.date] -= val;
      });

      const profitArray = Object.keys(profitMap)
        .map((date) => ({ date, dailyProfit: profitMap[date] }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      setProfitData(profitArray);

      // 4. Today's Metrics
      const now = new Date();
      const localNow = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000,
      );
      const todayIsoStr = localNow.toISOString().split("T")[0];

      const todayTxns = await db
        .select({ type: transactions.type, amount: transactions.totalAmount })
        .from(transactions)
        .where(eq(transactions.date, todayIsoStr));

      let rev = 0,
        exp = 0;
      todayTxns.forEach((t) => {
        if (t.type === "Selling") rev += t.amount || 0;
        if (t.type === "Buying") exp += t.amount || 0;
      });

      setTodaysMetrics({ revenue: rev, expenditure: exp, profit: rev - exp });
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [timeframe]),
  );

  const handleExport = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        setErrorMessage("External storage not available.");
        setErrorModalVisible(true);
        return;
      }
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
        Alert.alert("No Data", "No transactions to export.");
        return;
      }

      const rows = allData
        .map(
          (d) =>
            `${d.txId},${d.date},${d.type},${d.payment},${d.status},${d.material},${d.weight},${d.price},${d.subtotal}`,
        )
        .join("\n");

      const fileUri = FileSystem.documentDirectory + "transactions_export.csv";
      await FileSystem.writeAsStringAsync(
        fileUri,
        "Transaction ID,Date,Type,Payment,Status,Material,Weight,Price,Subtotal\n" +
          rows,
        { encoding: "utf8" },
      );
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      setErrorMessage("Export failed: " + error.message);
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
        <View
          className="flex-1 justify-center items-center rounded-lg border border-dashed"
          style={{ borderColor: theme.border, backgroundColor: theme.subtleBg }}
        >
          <Text style={{ color: theme.textSecondary }}>
            No stock data available
          </Text>
        </View>
      );
    }

    const { height: containerHeight } = chartAreaDimensions;
    const PADDING_TOP = 20;
    const PADDING_BOTTOM = 30;
    const GRAPH_HEIGHT = containerHeight - PADDING_TOP - PADDING_BOTTOM;
    const BAR_WIDTH = 40;
    const BAR_GAP = 30;
    const ITEM_WIDTH = BAR_WIDTH + BAR_GAP;

    const maxValue = Math.max(...stockData.map((d) => d.totalWeight), 1);
    const gridMax = Math.ceil(maxValue / 10) * 10;
    const scrollWidth = Math.max(
      chartAreaDimensions.width,
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
                  stroke={theme.chartGrid}
                  strokeWidth="1"
                  strokeDasharray="4, 4"
                />
              );
            })}
            {stockData.map((item, index) => {
              const barHeight = (item.totalWeight / gridMax) * GRAPH_HEIGHT;
              const x = index * ITEM_WIDTH + BAR_GAP / 2;
              const y = PADDING_TOP + GRAPH_HEIGHT - barHeight;
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
                    fill={theme.textSecondary}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {Math.round(item.totalWeight)}
                  </SvgText>
                  <SvgText
                    x={x + BAR_WIDTH / 2}
                    y={containerHeight - 5}
                    fontSize="11"
                    fill={theme.textPrimary}
                    textAnchor="middle"
                  >
                    {item.name?.length > 8
                      ? item.name.substring(0, 8) + "."
                      : item.name}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </ScrollView>
      </View>
    );
  };

  // --- AREA CHART (Gradient + Split Colors) ---
  const renderLineGraph = () => {
    if (
      !profitData ||
      profitData.length === 0 ||
      lineGraphDimensions.height === 0
    ) {
      return (
        <View
          className="flex-1 justify-center items-center rounded-lg border border-dashed"
          style={{ borderColor: theme.border, backgroundColor: theme.subtleBg }}
        >
          <Text style={{ color: theme.textSecondary }}>
            No transaction data
          </Text>
        </View>
      );
    }

    const { width, height } = lineGraphDimensions;
    const PADDING = 30;
    const graphWidth = width - PADDING * 2;
    const graphHeight = height - PADDING * 2;

    const dataValues = profitData.map((d) => d.dailyProfit);
    const maxVal = Math.max(...dataValues);
    const minVal = Math.min(...dataValues);
    const range = maxVal - minVal || 100;

    // Calculate Coordinates
    const points = profitData.map((item, index) => {
      const x = PADDING + index * (graphWidth / (profitData.length - 1 || 1));
      const y =
        height - PADDING - ((item.dailyProfit - minVal) / range) * graphHeight;
      return { x, y, ...item };
    });

    const zeroY = height - PADDING - ((0 - minVal) / range) * graphHeight;
    let splitOffset = 0;
    if (maxVal > 0 && minVal < 0) {
      splitOffset = maxVal / (maxVal - minVal);
    } else if (maxVal <= 0) {
      splitOffset = 0;
    } else {
      splitOffset = 1;
    }

    const createSmoothPath = (pts) => {
      if (pts.length === 0) return "";
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const current = pts[i];
        const next = pts[i + 1];
        const cpX1 = current.x + (next.x - current.x) * 0.2;
        const cpY1 = current.y;
        const cpX2 = next.x - (next.x - current.x) * 0.2;
        const cpY2 = next.y;
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
      }
      return path;
    };

    const linePath = createSmoothPath(points);
    const areaPath = `${linePath} L ${width - PADDING} ${height - PADDING} L ${PADDING} ${height - PADDING} Z`;
    const labelStep = Math.ceil(points.length / 5);

    const POSITIVE_COLOR = theme.success;
    const NEGATIVE_COLOR = theme.danger;

    return (
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={POSITIVE_COLOR} />
            <Stop offset={splitOffset} stopColor={POSITIVE_COLOR} />
            <Stop offset={splitOffset} stopColor={NEGATIVE_COLOR} />
            <Stop offset="1" stopColor={NEGATIVE_COLOR} />
          </LinearGradient>

          <LinearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={POSITIVE_COLOR} stopOpacity="0.4" />
            <Stop
              offset={splitOffset}
              stopColor={POSITIVE_COLOR}
              stopOpacity="0.05"
            />
            <Stop
              offset={splitOffset}
              stopColor={NEGATIVE_COLOR}
              stopOpacity="0.05"
            />
            <Stop offset="1" stopColor={NEGATIVE_COLOR} stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        <Line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={height - PADDING}
          stroke={theme.chartGrid}
          strokeWidth="1"
        />
        <Line
          x1={PADDING}
          y1={height - PADDING}
          x2={width - PADDING}
          y2={height - PADDING}
          stroke={theme.chartGrid}
          strokeWidth="1"
        />

        {minVal < 0 && maxVal > 0 && (
          <Line
            x1={PADDING}
            y1={zeroY}
            x2={width - PADDING}
            y2={zeroY}
            stroke={theme.chartText}
            strokeWidth="1"
            strokeDasharray="4, 4"
            opacity="0.6"
          />
        )}

        {points.length > 1 && (
          <Path d={areaPath} fill="url(#fillGradient)" stroke="none" />
        )}

        {points.length > 1 && (
          <Path
            d={linePath}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth="3"
          />
        )}

        {points.map((p, i) => {
          if (i % labelStep !== 0 && i !== points.length - 1) return null;
          const dotColor = p.dailyProfit >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR;

          return (
            <React.Fragment key={i}>
              <Circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill={dotColor}
                stroke={theme.card}
                strokeWidth="1.5"
              />

              <SvgText
                x={p.x}
                y={p.y - 12}
                fontSize="10"
                fill={dotColor}
                textAnchor="middle"
                fontWeight="bold"
              >
                {Math.round(p.dailyProfit).toLocaleString()}
              </SvgText>

              <SvgText
                x={p.x}
                y={height - 10}
                fontSize="9"
                fill={theme.chartText}
                textAnchor="middle"
              >
                {new Date(p.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  return (
    <View
      className="flex-1 p-4 gap-4"
      style={{ backgroundColor: theme.background }}
    >
      {/* KPIS */}
      <View className="flex-row gap-3 h-24">
        {[
          {
            label: "Revenue Today",
            val: todaysMetrics.revenue,
            color: theme.success,
          },
          {
            label: "Buying Today",
            val: todaysMetrics.expenditure,
            color: theme.danger,
          },
        ].map((item, idx) => (
          <View
            key={idx}
            className="flex-1 rounded-2xl p-2 justify-center items-center shadow-sm"
            style={{ backgroundColor: theme.card }}
          >
            <Text
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: theme.textSecondary }}
            >
              {item.label}
            </Text>
            <Text
              className="text-2xl font-bold mt-1"
              style={{ color: item.color }}
              numberOfLines={1}
            >
              ₱{item.val.toLocaleString()}
            </Text>
          </View>
        ))}

        <View
          className="flex-1 rounded-2xl p-2 justify-center items-center shadow-sm"
          style={{ backgroundColor: theme.card }}
        >
          <Text
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: theme.textSecondary }}
          >
            Profit Today
          </Text>
          <Text
            className="text-2xl font-bold mt-1"
            style={{
              color:
                todaysMetrics.profit >= 0 ? "#3b82f6" : "rgb(249, 115, 22)",
            }}
            numberOfLines={1}
          >
            ₱{todaysMetrics.profit.toLocaleString()}
          </Text>
        </View>

        <Pressable
          onPress={handleExport}
          className="flex-1 rounded-2xl justify-center items-center shadow-sm active:bg-amber-600"
          style={{ backgroundColor: theme.primary }}
        >
          <Download color="white" size={28} />
          <Text className="text-white text-xl font-bold mt-1">Export</Text>
        </Pressable>
      </View>

      {/* CHARTS */}
      <View className="flex-1 flex-row gap-4">
        {/* STOCK CHART */}
        <View
          className="flex-1 rounded-2xl p-4 shadow-sm overflow-hidden"
          style={{ backgroundColor: theme.card }}
        >
          <Text
            className="text-lg font-bold mb-2"
            style={{ color: theme.textPrimary }}
          >
            Current Stock Levels
          </Text>
          <View
            className="flex-1"
            onLayout={(e) => setChartAreaDimensions(e.nativeEvent.layout)}
          >
            {renderBarChart()}
          </View>
        </View>

        {/* PROFIT CHART */}
        <View
          className="flex-1 rounded-2xl p-4 shadow-sm overflow-hidden"
          style={{ backgroundColor: theme.card }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className="text-lg font-bold"
              style={{ color: theme.textPrimary }}
            >
              Profit Trend
            </Text>
          </View>

          {/* TIMELINE FILTER */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: theme.subtleBg,
              borderRadius: 8,
              padding: 4,
              marginBottom: 8,
            }}
          >
            {["7d", "1m", "3m", "6m"].map((item) => (
              <Pressable
                key={item}
                onPress={() => setTimeframe(item)}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  borderRadius: 6,
                  alignItems: "center",
                  backgroundColor:
                    timeframe === item ? theme.card : "transparent",
                  shadowColor: timeframe === item ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: timeframe === item ? 0.1 : 0,
                  elevation: timeframe === item ? 1 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    color: timeframe === item ? "#2563eb" : theme.textSecondary,
                  }}
                >
                  {item.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            className="flex-1"
            onLayout={(e) => setLineGraphDimensions(e.nativeEvent.layout)}
          >
            {renderLineGraph()}
          </View>
        </View>
      </View>

      {/* TABLE */}
      <View
        className="flex-1 rounded-2xl p-2 shadow-sm"
        style={{ backgroundColor: theme.card }}
      >
        <Text
          className="text-xl font-bold mb-4 px-2 pt-2"
          style={{ color: theme.textPrimary }}
        >
          Pending Inventory (Unallocated Stock)
        </Text>
        <View
          className="flex-row border-b pb-3 mb-2 p-3 rounded-t-md"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.subtleBg,
          }}
        >
          <Text
            className="flex-1 font-bold text-sm"
            style={{ color: theme.textSecondary }}
          >
            TX ID
          </Text>
          <Text
            className="flex-1 font-bold text-sm"
            style={{ color: theme.textSecondary }}
          >
            LINE ID
          </Text>
          <Text
            className="flex-[2] font-bold text-sm"
            style={{ color: theme.textSecondary }}
          >
            MATERIAL
          </Text>
          <Text
            className="flex-[1.5] font-bold text-sm text-right"
            style={{ color: theme.textSecondary }}
          >
            UNALLOCATED
          </Text>
          <Text
            className="flex-[1.5] font-bold text-sm text-center"
            style={{ color: theme.textSecondary }}
          >
            DATE
          </Text>
        </View>

        <FlatList
          data={unallocatedItems}
          keyExtractor={(item) => item.lineId.toString()}
          showsVerticalScrollIndicator={true}
          renderItem={({ item, index }) => {
            const remaining = item.originalWeight - item.totalAllocated;
            // Alternate colors based on theme
            const rowBg = index % 2 === 0 ? theme.card : theme.subtleBg;

            return (
              <View
                className="flex-row border-b py-4 px-3 items-center"
                style={{
                  borderColor: theme.border,
                  backgroundColor: rowBg,
                }}
              >
                <Text
                  className="flex-1 font-medium text-sm"
                  style={{ color: theme.textPrimary }}
                >
                  #{item.txId}
                </Text>
                <Text
                  className="flex-1 font-medium text-sm"
                  style={{ color: theme.textPrimary }}
                >
                  #{item.lineId}
                </Text>
                <Text
                  className="flex-[2] font-bold text-sm"
                  style={{ color: theme.textPrimary }}
                >
                  {item.material}
                </Text>
                <Text
                  className="flex-[1.5] font-bold text-sm text-right"
                  style={{ color: "#3b82f6" }}
                >
                  {remaining.toFixed(2)} {item.uom}
                </Text>
                <Text
                  className="flex-[1.5] text-sm text-center"
                  style={{ color: theme.textSecondary }}
                >
                  {item.date}
                </Text>
              </View>
            );
          }}
        />
      </View>

      {/* MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View
            className="w-[80%] rounded-2xl p-6 items-center shadow-lg"
            style={{ backgroundColor: theme.card }}
          >
            <XCircle
              size={50}
              color={theme.danger}
              style={{ marginBottom: 15 }}
            />
            <Text
              className="text-xl font-bold mb-2 text-center"
              style={{ color: theme.textPrimary }}
            >
              Export Failed
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary }}
            >
              {errorMessage}
            </Text>
            <Pressable
              onPress={() => setErrorModalVisible(false)}
              className="px-8 py-3 rounded-full"
              style={{ backgroundColor: "#333" }}
            >
              <Text className="text-white font-bold">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
