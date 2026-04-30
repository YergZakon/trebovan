"use client";

import { useState, useCallback } from "react";
import HorizontalBar from "@/components/charts/HorizontalBar";
import DonutChart from "@/components/charts/DonutChart";
import { LOAD_TYPE_COLORS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

const tabs = [
  { key: "sphere", label: "По сферам" },
  { key: "loadType", label: "По видам нагрузки" },
  { key: "authority", label: "По органам" },
] as const;

type Requirement = {
  c: string; // code
  t: string; // text
  a: string; // authority
  l: string; // load type
};

type SpherePageData = {
  id: number;
  name: string;
  total: number;
  page: number;
  totalPages: number;
  requirements: Requirement[];
};

export default function OkedDetailTabs({
  sphereChart,
  loadTypeChart,
  authorityChart,
}: {
  sphereChart: { id: number; name: string; fullName: string; value: number }[];
  loadTypeChart: { name: string; value: number }[];
  authorityChart: { name: string; value: number }[];
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("sphere");
  const [activeSphere, setActiveSphere] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [sphereMeta, setSphereMeta] = useState<{
    total: number;
    loadedPages: number;
    totalPages: number;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_DISPLAY = 50;

  const loadSphere = useCallback(async (sphereId: number, name: string) => {
    setActiveSphere({ id: sphereId, name });
    setLoading(true);
    setRequirements([]);
    setSearch("");
    setPage(0);

    try {
      // Load first page
      const res = await fetch(`/api/spheres/${sphereId}_0.json`);
      const data: SpherePageData = await res.json();
      setRequirements(data.requirements);
      setSphereMeta({
        total: data.total,
        loadedPages: 1,
        totalPages: data.totalPages,
      });

      // Load remaining pages in background
      if (data.totalPages > 1) {
        const promises = [];
        for (let p = 1; p < data.totalPages; p++) {
          promises.push(
            fetch(`/api/spheres/${sphereId}_${p}.json`).then((r) => r.json())
          );
        }
        const pages: SpherePageData[] = await Promise.all(promises);
        const allReqs = [
          ...data.requirements,
          ...pages.flatMap((p) => p.requirements),
        ];
        setRequirements(allReqs);
        setSphereMeta({
          total: data.total,
          loadedPages: data.totalPages,
          totalPages: data.totalPages,
        });
      }
    } catch {
      console.error("Failed to load sphere requirements");
    } finally {
      setLoading(false);
    }
  }, []);

  const closeSphere = () => {
    setActiveSphere(null);
    setRequirements([]);
    setSphereMeta(null);
    setSearch("");
    setPage(0);
  };

  const filtered = search.length >= 2
    ? requirements.filter(
        (r) =>
          r.t.toLowerCase().includes(search.toLowerCase()) ||
          r.c.includes(search) ||
          r.a.toLowerCase().includes(search.toLowerCase())
      )
    : requirements;

  const displayed = filtered.slice(
    page * PAGE_DISPLAY,
    (page + 1) * PAGE_DISPLAY
  );
  const totalDisplayPages = Math.ceil(filtered.length / PAGE_DISPLAY);

  return (
    <div className="space-y-4">
      {/* Tabs + Charts */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex gap-1 rounded-lg bg-gray-200 p-1 dark:bg-gray-800">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "sphere" && (
          <div>
            <HorizontalBar
              data={sphereChart}
              dataKey="value"
              nameKey="name"
              color="#3b82f6"
              height={Math.max(300, sphereChart.length * 38)}
              onClick={(item) => loadSphere(item.id as number, item.fullName as string)}
            />
            <p className="mt-2 text-center text-xs text-gray-400">
              Кликните на сферу для просмотра требований
            </p>
          </div>
        )}

        {tab === "loadType" && (
          <DonutChart
            data={loadTypeChart}
            dataKey="value"
            nameKey="name"
            colorMap={LOAD_TYPE_COLORS}
            height={400}
          />
        )}

        {tab === "authority" && (
          <HorizontalBar
            data={authorityChart}
            dataKey="value"
            nameKey="name"
            color="#8b5cf6"
            height={Math.max(300, authorityChart.length * 45)}
          />
        )}
      </div>

      {/* Requirements drill-down */}
      {activeSphere && (
        <div className="rounded-xl border border-blue-200 bg-white p-5 dark:border-blue-800 dark:bg-gray-900">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {activeSphere.name}
              </h3>
              <p className="text-xs text-gray-400">
                {sphereMeta
                  ? `${formatNumber(sphereMeta.total)} требований`
                  : "Загрузка..."}
                {search && filtered.length !== requirements.length
                  ? ` (найдено: ${formatNumber(filtered.length)})`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Поиск по тексту, коду, органу..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 sm:w-64"
              />
              <button
                onClick={closeSphere}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Закрыть
              </button>
            </div>
          </div>

          {loading && requirements.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Загрузка требований...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="w-8 px-2 py-2">#</th>
                      <th className="px-2 py-2">Код</th>
                      <th className="px-2 py-2">Требование</th>
                      <th className="px-2 py-2">Тип нагрузки</th>
                      <th className="px-2 py-2">Орган</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((r, i) => (
                      <tr
                        key={`${r.c}-${page * PAGE_DISPLAY + i}`}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="px-2 py-2 text-xs text-gray-400">
                          {page * PAGE_DISPLAY + i + 1}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-xs text-blue-600 dark:text-blue-400">
                          {r.c}
                        </td>
                        <td className="max-w-md px-2 py-2 text-xs text-gray-700 dark:text-gray-300">
                          {r.t}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500">
                          {r.l}
                        </td>
                        <td className="max-w-[200px] truncate px-2 py-2 text-xs text-gray-500">
                          {r.a}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalDisplayPages > 1 && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Страница {page + 1} из {totalDisplayPages}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-30 dark:border-gray-700"
                    >
                      Назад
                    </button>
                    <button
                      onClick={() =>
                        setPage(Math.min(totalDisplayPages - 1, page + 1))
                      }
                      disabled={page >= totalDisplayPages - 1}
                      className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-30 dark:border-gray-700"
                    >
                      Вперёд
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
