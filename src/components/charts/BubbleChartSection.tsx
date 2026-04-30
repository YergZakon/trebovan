"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/utils";

type SectionPoint = {
  section: string;
  name: string;
  businesses: number;
  avgReqs: number;
  avgSpheres: number;
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: SectionPoint }[] }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 shadow-lg">
      <div className="font-semibold text-white">{d.name}</div>
      <div>Бизнес-субъекты: {formatNumber(d.businesses)}</div>
      <div>Средн. требований: {formatNumber(d.avgReqs)}</div>
      <div>Средн. сфер: {d.avgSpheres}</div>
    </div>
  );
}

export default function BubbleChartSection({ data }: { data: SectionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
        <XAxis
          type="number"
          dataKey="businesses"
          name="Бизнес-субъекты"
          scale="log"
          domain={["auto", "auto"]}
          tickFormatter={(v: number) => formatNumber(v)}
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          label={{ value: "Бизнес-субъекты (лог. шкала)", position: "bottom", fill: "#9ca3af", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey="avgReqs"
          name="Средн. требований"
          tickFormatter={(v: number) => formatNumber(v)}
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          label={{ value: "Средн. требований на ОКЭД", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <ZAxis
          type="number"
          dataKey="avgSpheres"
          range={[200, 1200]}
          name="Средн. сфер"
        />
        <Tooltip content={<CustomTooltip />} />
        <Scatter
          data={data}
          fill="#3b82f6"
          fillOpacity={0.7}
          stroke="#60a5fa"
          strokeWidth={1}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
