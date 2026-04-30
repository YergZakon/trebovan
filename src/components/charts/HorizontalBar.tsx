"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatNumber } from "@/lib/utils";

export default function HorizontalBar({
  data,
  dataKey = "value",
  nameKey = "name",
  color = "#3b82f6",
  colorMap,
  height = 400,
  onClick,
}: {
  data: Record<string, unknown>[];
  dataKey?: string;
  nameKey?: string;
  color?: string;
  colorMap?: Record<string, string>;
  height?: number;
  onClick?: (item: Record<string, unknown>) => void;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
      >
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatNumber(v)}
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={260}
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [formatNumber(Number(v)), ""]}
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 8,
            color: "#f3f4f6",
          }}
        />
        <Bar
          dataKey={dataKey}
          radius={[0, 4, 4, 0]}
          cursor={onClick ? "pointer" : undefined}
          onClick={onClick ? (_: unknown, index: number) => onClick(data[index]) : undefined}
        >
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                colorMap
                  ? colorMap[entry[nameKey] as string] || color
                  : color
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
