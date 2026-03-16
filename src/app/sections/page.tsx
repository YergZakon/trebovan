import { formatNumber } from "@/lib/utils";
import sectionsSummary from "../../../data/generated/sections_summary.json";
import SectionsChartWrapper from "./SectionsChartWrapper";

const bubbleData = sectionsSummary.map((s) => ({
  section: s.section,
  name: s.name,
  businesses: s.businesses.total,
  avgReqs: s.avgReqs,
  avgSpheres: s.avgSpheres,
}));

export default function SectionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Секции ОКЭД
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Сравнительный анализ регуляторной нагрузки по секциям экономической деятельности
        </p>
      </div>

      {/* Bubble chart */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Карта секций: бизнес-субъекты vs требования
        </h2>
        <p className="mb-4 text-xs text-gray-400">
          Размер пузырька = среднее число сфер контроля на ОКЭД
        </p>
        <SectionsChartWrapper data={bubbleData} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Детали по секциям
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-3 py-2">Секция</th>
                <th className="px-3 py-2">Название</th>
                <th className="px-3 py-2 text-right">ОКЭД</th>
                <th className="px-3 py-2 text-right">Бизнес</th>
                <th className="px-3 py-2 text-right">Работники (тыс.)</th>
                <th className="px-3 py-2 text-right">Средн. треб.</th>
                <th className="px-3 py-2 text-right">На 1000 раб.</th>
                <th className="px-3 py-2 text-right">Средн. сфер</th>
                <th className="px-3 py-2 text-right">ИРК средн.</th>
                <th className="px-3 py-2 text-right">ИРК макс.</th>
              </tr>
            </thead>
            <tbody>
              {sectionsSummary.map((s) => (
                <tr
                  key={s.section}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-3 py-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {s.section}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-gray-700 dark:text-gray-300">
                    {s.name}
                  </td>
                  <td className="px-3 py-2 text-right">{s.okeds}</td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatNumber(s.businesses.total)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {s.workers ? formatNumber(Math.round(s.workers)) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatNumber(s.avgReqs)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-orange-600 dark:text-orange-400">
                    {s.reqsPer1000Workers || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">{s.avgSpheres}</td>
                  <td className="px-3 py-2 text-right">
                    {formatNumber(s.irkAvg)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatNumber(s.irkMax)}
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
