import fs from "fs";
import path from "path";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import { formatNumber, formatPercent } from "@/lib/utils";
import { SECTION_NAMES } from "@/lib/constants";
import OkedDetailTabs from "./OkedDetailTabs";

const okedDir = path.join(process.cwd(), "data", "generated", "oked");

export function generateStaticParams() {
  const files = fs.readdirSync(okedDir);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ id: f.replace(".json", "") }));
}

type OkedData = {
  id: string;
  name: string;
  reqs: number;
  spheres: number;
  auths: number;
  irk: number;
  irkNorm: number;
  irkLog: number;
  rank: number;
  irkRank: number;
  section: string;
  workers: number;
  reqsPer1000Workers: number;
  business: {
    name: string;
    total: number;
    smallLegal: number;
    mediumLegal: number;
    individual: number;
    farming: number;
  } | null;
  bySphere: { name: string; count: number; auths: string[] }[];
  byLoadType: { name: string; count: number }[];
  byAuthority: { name: string; count: number }[];
};

export default async function OkedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const filePath = path.join(okedDir, `${id}.json`);
  const data: OkedData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const sphereChart = data.bySphere
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((s) => ({
      name: s.name.length > 50 ? s.name.slice(0, 50) + "..." : s.name,
      value: s.count,
    }));

  const loadTypeChart = data.byLoadType
    .filter((l) => l.count > 0)
    .map((l) => ({ name: l.name, value: l.count }));

  const authorityChart = data.byAuthority
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((a) => ({
      name: a.name.length > 55 ? a.name.slice(0, 55) + "..." : a.name,
      value: a.count,
    }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-500">
          Обзор
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">ОКЭД {data.id}</span>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-blue-100 px-3 py-1 font-mono text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {data.id}
          </span>
          <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Секция {data.section} - {SECTION_NAMES[data.section] || data.section}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
          {data.name}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon="📋"
          label="Требования"
          value={formatNumber(data.reqs)}
          subtitle={`Ранг: ${data.rank} из 1 301`}
        />
        <StatCard
          icon="🏛️"
          label="Сферы контроля"
          value={String(data.spheres)}
        />
        <StatCard
          icon="🏢"
          label="Органы контроля"
          value={String(data.auths)}
        />
        <StatCard
          icon="📊"
          label="ИРК"
          value={formatNumber(data.irk)}
          subtitle={`${formatPercent(data.irkNorm)} от макс.`}
        />
        <StatCard
          icon="🏆"
          label="Ранг по ИРК"
          value={`${data.irkRank} / 1 301`}
        />
        <StatCard
          icon="👷"
          label="На 1 000 работников"
          value={data.reqsPer1000Workers > 0 ? String(data.reqsPer1000Workers) : "н/д"}
          subtitle={data.workers > 0 ? `${formatNumber(Math.round(data.workers * 1000))} работников` : undefined}
        />
      </div>

      {/* Business data */}
      {data.business && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Субъекты бизнеса
          </h2>
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Секция: {data.business.name}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <div className="text-xs text-gray-400">Всего</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(data.business.total)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Малые ЮЛ</div>
              <div className="text-lg font-semibold">
                {formatNumber(data.business.smallLegal)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Средние ЮЛ</div>
              <div className="text-lg font-semibold">
                {formatNumber(data.business.mediumLegal)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">ИП</div>
              <div className="text-lg font-semibold">
                {formatNumber(data.business.individual)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">КХ</div>
              <div className="text-lg font-semibold">
                {formatNumber(data.business.farming)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs with charts */}
      <OkedDetailTabs
        sphereChart={sphereChart}
        loadTypeChart={loadTypeChart}
        authorityChart={authorityChart}
      />
    </div>
  );
}
