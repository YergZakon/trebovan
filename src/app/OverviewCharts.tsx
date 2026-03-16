"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import HorizontalBar from "@/components/charts/HorizontalBar";
import { formatNumber } from "@/lib/utils";

type OkedRow = {
  id: string;
  name: string;
  reqs: number;
  spheres: number;
  auths: number;
  irk: number;
  rank: number;
  section: string | null;
  reqsPer1000W: number;
};

export default function OverviewCharts({
  top10,
  sectionBusiness,
  okedSummary,
}: {
  top10: { name: string; fullName: string; value: number; id: string }[];
  sectionBusiness: { name: string; value: number }[];
  okedSummary: OkedRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"rank" | "reqs" | "irk" | "spheres" | "reqsPer1000W">("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let items = okedSummary;
    if (search.length >= 2) {
      const q = search.toLowerCase();
      items = items.filter(
        (o) => o.id.includes(q) || o.name.toLowerCase().includes(q)
      );
    }
    return [...items].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortAsc ? diff : -diff;
    });
  }, [okedSummary, search, sortKey, sortAsc]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "rank");
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <span className="text-gray-600">&#8597;</span>;
    return <span>{sortAsc ? "\u2191" : "\u2193"}</span>;
  };

  return (
    <div className="space-y-8">
      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            ТОП-10 наиболее регулируемых ОКЭД
          </h2>
          <HorizontalBar
            data={top10}
            dataKey="value"
            nameKey="name"
            color="#3b82f6"
            height={380}
            onClick={(item) => router.push(`/oked/${item.id}`)}
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            Субъекты бизнеса по секциям
          </h2>
          <HorizontalBar
            data={sectionBusiness}
            dataKey="value"
            nameKey="name"
            color="#10b981"
            height={380}
          />
        </div>
      </div>

      {/* OKED table */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Все ОКЭД ({formatNumber(okedSummary.length)})
          </h2>
          <input
            type="text"
            placeholder="Фильтр по коду или названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 sm:w-72"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="cursor-pointer px-3 py-2" onClick={() => handleSort("rank")}>
                  # <SortIcon col="rank" />
                </th>
                <th className="px-3 py-2">Код</th>
                <th className="px-3 py-2">Название</th>
                <th className="px-3 py-2">Секция</th>
                <th className="cursor-pointer px-3 py-2 text-right" onClick={() => handleSort("reqs")}>
                  Требования <SortIcon col="reqs" />
                </th>
                <th className="cursor-pointer px-3 py-2 text-right" onClick={() => handleSort("spheres")}>
                  Сферы <SortIcon col="spheres" />
                </th>
                <th className="cursor-pointer px-3 py-2 text-right" onClick={() => handleSort("irk")}>
                  ИРК <SortIcon col="irk" />
                </th>
                <th className="cursor-pointer px-3 py-2 text-right" onClick={() => handleSort("reqsPer1000W")}>
                  На 1000 раб. <SortIcon col="reqsPer1000W" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((o) => (
                <tr
                  key={o.id}
                  onClick={() => router.push(`/oked/${o.id}`)}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
                >
                  <td className="px-3 py-2 text-gray-400">{o.rank}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {o.id}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-gray-700 dark:text-gray-300">
                    {o.name}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{o.section}</td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatNumber(o.reqs)}
                  </td>
                  <td className="px-3 py-2 text-right">{o.spheres}</td>
                  <td className="px-3 py-2 text-right">
                    {formatNumber(o.irk)}
                  </td>
                  <td className="px-3 py-2 text-right text-orange-600 dark:text-orange-400">
                    {o.reqsPer1000W > 0 ? o.reqsPer1000W : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p className="mt-3 text-center text-xs text-gray-400">
              Показано 100 из {formatNumber(filtered.length)}. Используйте поиск для уточнения.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
