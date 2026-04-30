import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatCard from "@/components/ui/StatCard";
import { formatNumber } from "@/lib/utils";

type ShortCard = {
  card_code: string;
  sphere_code: string;
  subsphere: string | null;
  short_title: string | null;
  role_fragment: string | null;
  role_class: "core" | "procedural" | "noise" | "disputed" | "uncategorized";
  requirement_type: string | null;
  mandatory_level: string | null;
  specificity: "concrete" | "framework" | "referential" | "principle" | null;
  confidence: number | null;
  has_duplicate_alert?: boolean;
};

type SphereData = {
  sphere_code: string;
  sphere_name: string;
  total_cards: number;
  role_class_counts: Record<string, number>;
  specificity_counts: Record<string, number>;
  business_route_count: number;
  role_counts: Record<string, number>;
  subspheres_in_data: { name: string; count: number; cards: ShortCard[] }[];
  subsphere_dict: {
    code: string;
    name: string;
    is_business_facing: boolean;
    display_order: number;
    cards_count: number;
    business_facing_cards: number;
  }[];
};


const mvpDir = path.join(process.cwd(), "data", "generated", "mvp");

export function generateStaticParams() {
  const dir = path.join(mvpDir, "spheres");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ sphere: f.replace(".json", "") }));
}

const ROLE_CLASS_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
  core:          { label: "Требования к предпринимателю", color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800", emoji: "🟢" },
  procedural:    { label: "Действия при проверках",       color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800", emoji: "🟡" },
  noise:         { label: "Процедуры госорганов",         color: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800", emoji: "🏛️" },
  disputed:      { label: "Спорные",                       color: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800", emoji: "⚖️" },
  uncategorized: { label: "Не классифицировано",           color: "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800", emoji: "❓" },
};

function CardRow({ c }: { c: ShortCard }) {
  const cls = ROLE_CLASS_LABEL[c.role_class] || ROLE_CLASS_LABEL.uncategorized;
  return (
    <Link
      href={`/cards/${c.card_code}`}
      className="block rounded-lg border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-gray-400">{c.card_code}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium border ${cls.color}`}>
              {cls.emoji} {c.role_fragment || "—"}
            </span>
            {c.has_duplicate_alert && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" title="Похожие требования в реестре">
                ⚠️ есть похожие
              </span>
            )}
            {c.requirement_type && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {c.requirement_type}
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-900 dark:text-white">{c.short_title || "(без заголовка)"}</div>
        </div>
        {c.confidence !== null && (
          <div className="shrink-0 text-right">
            <div className="text-xs text-gray-400">conf</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{(c.confidence * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function SpherePage({
  params,
}: {
  params: Promise<{ sphere: string }>;
}) {
  const { sphere } = await params;
  const fp = path.join(mvpDir, "spheres", `${sphere}.json`);
  if (!fs.existsSync(fp)) notFound();

  const data: SphereData = JSON.parse(fs.readFileSync(fp, "utf-8"));

  const allCards = data.subspheres_in_data.flatMap((s) => s.cards);
  const grouped: Record<string, ShortCard[]> = { core: [], procedural: [], noise: [], disputed: [], uncategorized: [] };
  for (const c of allCards) (grouped[c.role_class] ||= []).push(c);

  // подсферы: business-facing сверху
  const businessFacingSubs = data.subsphere_dict.filter((s) => s.is_business_facing).sort((a, b) => a.display_order - b.display_order);
  const hiddenSubs = data.subsphere_dict.filter((s) => !s.is_business_facing).sort((a, b) => a.display_order - b.display_order);

  const counts = data.role_class_counts;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-500">Обзор</Link>
        <span>/</span>
        <Link href="/spheres" className="hover:text-blue-500">MVP по 3 сферам</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{data.sphere_name}</span>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-blue-100 px-3 py-1 font-mono text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {data.sphere_code}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{data.sphere_name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon="📋" label="Всего требований" value={formatNumber(data.total_cards)} />
        <StatCard icon="🎯" label="К предпринимателю" value={formatNumber(data.business_route_count)} subtitle="без процедур органов" />
        <StatCard icon="📄" label="Из них с числовыми нормами" value={formatNumber(data.specificity_counts?.concrete || 0)} />
      </div>

      {businessFacingSubs.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Подсферы</h2>
          <div className="grid gap-1.5 md:grid-cols-2">
            {businessFacingSubs.map((s) => (
              <div key={s.code} className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                <span className="text-gray-800 dark:text-gray-200">{s.name}</span>
                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300">
                  {formatNumber(s.cards_count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Карточки по 4 классам ролей */}
      {(["core", "procedural", "noise", "disputed", "uncategorized"] as const).map((cls) => {
        const items = grouped[cls];
        if (!items || items.length === 0) return null;
        const meta = ROLE_CLASS_LABEL[cls];
        return (
          <div key={cls}>
            <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {items.length}
              </span>
            </h2>
            <div className="space-y-2">
              {items.map((c) => <CardRow key={c.card_code} c={c} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
