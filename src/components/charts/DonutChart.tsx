"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatNumber } from "@/lib/utils";

const DEFAULT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#6366f1",
];

export default function DonutChart({
  data,
  dataKey = "value",
  nameKey = "name",
  colorMap,
  height = 350,
}: {
  data: Record<string, unknown>[];
  dataKey?: string;
  nameKey?: string;
  colorMap?: Record<string, string>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                colorMap
                  ? colorMap[entry[nameKey] as string] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
                  : DEFAULT_COLORS[i % DEFAULT_COLORS.length]
              }
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [formatNumber(Number(v)), ""]}
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 8,
            color: "#f3f4f6",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
