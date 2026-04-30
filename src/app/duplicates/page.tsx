import StatCard from "@/components/ui/StatCard";
import { formatNumber } from "@/lib/utils";
import duplicates from "../../../data/generated/duplicates.json";

const totalPairs = duplicates.byType.reduce((sum, t) => sum + t.count, 0);

const crossPairsSorted = [...duplicates.crossPairs]
  .sort((a, b) => b.count - a.count)
  .slice(0, 20);

export default function DuplicatesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Анализ дубликатов
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Дублирующиеся требования между сферами и органами контроля
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon="📑"
          label="Всего пар дубликатов"
          value={formatNumber(totalPairs)}
        />
        {duplicates.byType.map((t) => (
          <StatCard
            key={t.type}
            label={t.type}
            value={formatNumber(t.count)}
            subtitle={`Средн. схожесть: ${(t.avgSim * 100).toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Top spheres with most duplicates */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Сферы с наибольшим числом дубликатов
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Сфера контроля</th>
                <th className="px-3 py-2 text-right">Пар дубликатов</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.topSpheres.map((s, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                    {s.sphere}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatNumber(s.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-sphere pairs */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Кросс-сферные пары дубликатов (ТОП-20)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Сфера 1</th>
                <th className="px-3 py-2">Сфера 2</th>
                <th className="px-3 py-2 text-right">Пар</th>
                <th className="px-3 py-2 text-right">Средн. схожесть</th>
                <th className="px-3 py-2 text-right">Макс. схожесть</th>
              </tr>
            </thead>
            <tbody>
              {crossPairsSorted.map((p, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="max-w-xs truncate px-3 py-2 text-gray-700 dark:text-gray-300">
                    {p.sphere1}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-gray-700 dark:text-gray-300">
                    {p.sphere2}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatNumber(p.count)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(p.avgSim * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(p.maxSim * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
