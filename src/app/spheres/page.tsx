import fs from "fs";
import path from "path";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import { formatNumber } from "@/lib/utils";

type SphereIndexItem = {
  code: string;
  name: string;
  total_cards: number;
  core: number;
  procedural: number;
  noise: number;
};

const indexPath = path.join(process.cwd(), "data", "generated", "mvp", "spheres_index.json");

const SPHERE_ICONS: Record<string, string> = {
  ecology: "🌿",
  transport: "🚛",
  land: "🏞️",
};

export default function SpheresIndexPage() {
  let spheres: SphereIndexItem[] = [];
  try {
    spheres = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  } catch {
    spheres = [];
  }

  const total = spheres.reduce((s, x) => s + x.total_cards, 0);
  const totalCore = spheres.reduce((s, x) => s + x.core, 0);
  const totalProc = spheres.reduce((s, x) => s + x.procedural, 0);
  const totalNoise = spheres.reduce((s, x) => s + x.noise, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-500">Обзор</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Реестр требований</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Реестр требований по сферам
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Земля, транспорт, экология — сферы, по которым собран структурированный реестр требований к предпринимателям и хозяйствующим субъектам.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon="📋" label="Всего требований" value={formatNumber(total)} />
        <StatCard icon="🎯" label="К предпринимателю" value={formatNumber(totalCore)} subtitle="обязанности, запреты, условия" />
        <StatCard icon="🟡" label="При проверках" value={formatNumber(totalProc)} subtitle="действия на акты надзора" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {spheres.map((s) => {
          const icon = SPHERE_ICONS[s.code] || "📑";
          const corePct = s.total_cards > 0 ? Math.round((s.core / s.total_cards) * 100) : 0;
          return (
            <Link
              key={s.code}
              href={`/spheres/${s.code}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-2xl">{icon}</span>
                <span className="font-mono text-xs text-gray-400">{s.code}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white">
                {s.name}
              </h3>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-gray-400">Всего</div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">{formatNumber(s.total_cards)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Ядро</div>
                  <div className="text-base font-semibold text-emerald-600">{formatNumber(s.core)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Процед.</div>
                  <div className="text-base font-semibold text-amber-600">{formatNumber(s.procedural)}</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${corePct}%` }}
                  title={`${corePct}% ядро`}
                />
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
