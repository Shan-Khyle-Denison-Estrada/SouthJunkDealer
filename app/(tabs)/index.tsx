import * as d3 from 'd3-shape';
import React, { useState } from 'react';
import { LayoutChangeEvent, Text, View } from "react-native"; // Removed ScrollView
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

export default function Index() {
  // --- 1. CHART DATA ---
  const pieData = [
    { value: 40, color: '#f87171', label: 'Sales' },     
    { value: 25, color: '#60a5fa', label: 'Marketing' }, 
    { value: 20, color: '#4ade80', label: 'IT' },        
    { value: 15, color: '#fbbf24', label: 'HR' },        
  ];

  const profitData = [
    { x: 1, y: 10 }, { x: 2, y: 30 }, { x: 3, y: 15 },
    { x: 4, y: 45 }, { x: 5, y: 35 }, { x: 6, y: 55 },
    { x: 7, y: 40 },
  ];

  const revenueData = [
    { x: 1, y: 25 }, { x: 2, y: 45 }, { x: 3, y: 35 },
    { x: 4, y: 60 }, { x: 5, y: 55 }, { x: 6, y: 45 },
    { x: 7, y: 65 },
  ];

  // --- 2. TABLE DATA ---
  const tableData = [
    { id: '#1001', product: 'Wireless Mouse', category: 'Accessories', price: '₱850.00', status: 'Completed' },
    { id: '#1002', product: 'Mech Keyboard', category: 'Electronics', price: '₱2,500.00', status: 'Pending' },
    { id: '#1003', product: 'HD Monitor 24"', category: 'Electronics', price: '₱7,200.00', status: 'Completed' },
    { id: '#1004', product: 'USB-C Hub', category: 'Accessories', price: '₱1,200.00', status: 'Completed' },
    { id: '#1005', product: 'Gaming Chair', category: 'Furniture', price: '₱8,500.00', status: 'Cancelled' },
    { id: '#1006', product: 'Laptop Stand', category: 'Furniture', price: '₱1,500.00', status: 'Completed' },
    { id: '#1007', product: 'Webcam 1080p', category: 'Electronics', price: '₱3,100.00', status: 'Pending' },
    { id: '#1008', product: 'Bluetooth Speaker', category: 'Audio', price: '₱1,800.00', status: 'Completed' },
  ];

  // --- 3. GRAPH SETUP ---
  const radius = 100; 
  const width = radius * 2;
  const height = radius * 2;
  const pieGenerator = d3.pie().value((d: any) => d.value);
  const arcGenerator = d3.arc().outerRadius(radius).innerRadius(0).padAngle(0); 
  const arcs = pieGenerator(pieData as any);

  const [lineLayout, setLineLayout] = useState({ width: 0, height: 0 });
  const margin = { top: 10, right: 10, bottom: 20, left: 25 };
  const graphWidth = lineLayout.width - margin.left - margin.right;
  const graphHeight = lineLayout.height - margin.top - margin.bottom;

  const minX = 1, maxX = 7;
  const minY = 0, maxY = 80;
  const getX = (val: number) => ((val - minX) / (maxX - minX)) * graphWidth;
  const getY = (val: number) => graphHeight - ((val - minY) / (maxY - minY)) * graphHeight;

  const lineGenerator = d3.line()
    .x((d: any) => getX(d.x))
    .y((d: any) => getY(d.y))
    .curve(d3.curveMonotoneX);

  const profitPath = lineGenerator(profitData as any);
  const revenuePath = lineGenerator(revenueData as any);

  return (
    <View className="flex-1 p-4 gap-4 bg-gray-100"> 
      
      {/* 1. Top Stats Row */}
      <View className="flex-1 w-full gap-4 flex-row"> 
        <View className="flex-1 bg-white w-full rounded-lg justify-center items-center">
          <Text className="font-medium text-gray-500">Total Inventory</Text>
          <Text className="text-2xl font-bold">69,000</Text>
        </View>
        <View className="flex-1 bg-white w-full rounded-lg justify-center items-center">
          <Text className="font-medium text-gray-500">Daily Profit</Text>
          <Text className="text-2xl font-bold">69,000</Text>
        </View>
        <View className="flex-1 bg-white w-full rounded-lg justify-center items-center">
          <Text className="font-medium text-gray-500">Daily Revenue</Text>
          <Text className="text-2xl font-bold">69,000</Text>
        </View>
        <View className="flex-1 bg-white w-full rounded-lg justify-center items-center">
          <Text className="font-medium text-gray-500">Procurement</Text>
          <Text className="text-2xl font-bold">69,000</Text>
        </View>
      </View>
      
      {/* 2. Middle Row (Charts) */}
      <View className="flex-[2] w-full flex-row gap-4">
        
        {/* Pie Chart */}
        <View className="flex-1 bg-white w-full rounded-lg flex-row p-3 overflow-hidden">
           <View className="flex-1 gap-2">
              <Text className="font-medium text-gray-500">Inventory Distribution</Text>
              <View className="gap-1">
                {pieData.map((item, index) => (
                  <View key={index} className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                    <View>
                      <Text className="text-xs text-gray-600 font-bold">{item.label}</Text>
                      <Text className="text-[10px] text-gray-400">{item.value}%</Text>
                    </View>
                  </View>
                ))}
              </View>
           </View>
           <View className="flex-[2] items-center justify-center">
              <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                <G x={radius} y={radius}>
                  {arcs.map((slice, index) => {
                    const path = arcGenerator(slice as any);
                    return <Path key={index} d={path || ''} fill={pieData[index].color} />;
                  })}
                </G>
              </Svg>
           </View>
        </View>
        
        {/* Line Graph */}
        <View className="flex-1 bg-white w-full rounded-lg p-3">
            <View className="flex-row justify-between items-center mb-1">
                <Text className="font-medium text-gray-500">Daily Sales Trend</Text>
                <View className="flex-row gap-4">
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded-full bg-blue-500 mr-1" />
                        <Text className="text-xs text-gray-500">Profit</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded-full bg-orange-400 mr-1" />
                        <Text className="text-xs text-gray-500">Revenue</Text>
                    </View>
                </View>
            </View>

            <View 
                className="flex-1 w-full"
                onLayout={(event: LayoutChangeEvent) => {
                    const { width, height } = event.nativeEvent.layout;
                    setLineLayout({ width, height });
                }}
            >
                {lineLayout.width > 0 && (
                  <Svg width={lineLayout.width} height={lineLayout.height}>
                    <G x={margin.left} y={margin.top}>
                        {[0, 20, 40, 60, 80].map((tickVal) => (
                            <G key={tickVal}>
                                <Line 
                                    x1={0} y1={getY(tickVal)} 
                                    x2={graphWidth} y2={getY(tickVal)} 
                                    stroke="#f3f4f6" strokeWidth="1" 
                                />
                                <SvgText 
                                    x={-6} y={getY(tickVal) + 4} 
                                    fill="#9ca3af" fontSize="10" textAnchor="end"
                                >
                                    {tickVal}
                                </SvgText>
                            </G>
                        ))}
                        {profitData.map((d) => (
                            <SvgText 
                                key={d.x}
                                x={getX(d.x)} y={graphHeight + 12} 
                                fill="#9ca3af" fontSize="10" textAnchor="middle"
                            >
                                D{d.x}
                            </SvgText>
                        ))}
                        
                        <Path d={profitPath || ''} stroke="#3b82f6" strokeWidth="3" fill="none" />
                        {profitData.map((d, i) => (
                            <Circle key={`p-${i}`} cx={getX(d.x)} cy={getY(d.y)} r={3} fill="white" stroke="#3b82f6" strokeWidth={2} />
                        ))}

                        <Path d={revenuePath || ''} stroke="#fb923c" strokeWidth="3" fill="none" />
                        {revenueData.map((d, i) => (
                            <Circle key={`r-${i}`} cx={getX(d.x)} cy={getY(d.y)} r={3} fill="white" stroke="#fb923c" strokeWidth={2} />
                        ))}
                    </G>
                  </Svg>
                )}
            </View>
        </View>
      </View>

      {/* 3. Bottom Row: Table (FIXED) */}
      <View className="flex-[3] bg-white w-full rounded-lg p-4">
        
        {/* Table Title */}
        <Text className="text-lg font-bold text-gray-700 mb-3">Recent Orders</Text>

        {/* Table Header */}
        <View className="flex-row border-b border-gray-200 pb-3 mb-2">
            <Text className="flex-1 font-bold text-gray-500 text-xs">ORDER ID</Text>
            <Text className="flex-[2] font-bold text-gray-500 text-xs">PRODUCT</Text>
            <Text className="flex-1 font-bold text-gray-500 text-xs">CATEGORY</Text>
            <Text className="flex-1 font-bold text-gray-500 text-xs text-right">PRICE</Text>
            <Text className="flex-1 font-bold text-gray-500 text-xs text-center">STATUS</Text>
        </View>

        {/* Table Body - CHANGED: View with overflow-hidden instead of ScrollView */}
        <View className="flex-1 overflow-hidden">
            {tableData.map((row, index) => (
                <View key={index} className="flex-row border-b border-gray-50 py-3 items-center hover:bg-gray-50">
                    <Text className="flex-1 text-gray-600 font-medium text-xs">{row.id}</Text>
                    <Text className="flex-[2] text-gray-800 font-bold text-sm">{row.product}</Text>
                    <Text className="flex-1 text-gray-500 text-xs">{row.category}</Text>
                    <Text className="flex-1 text-gray-700 font-semibold text-xs text-right">{row.price}</Text>
                    
                    <View className="flex-1 items-center">
                        <Text className={`text-[10px] font-bold px-2 py-1 rounded-full overflow-hidden 
                            ${row.status === 'Completed' ? 'bg-green-100 text-green-600' : 
                              row.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 
                              'bg-red-100 text-red-600'}`}>
                            {row.status}
                        </Text>
                    </View>
                </View>
            ))}
        </View>

      </View>
      
    </View>
  );
}