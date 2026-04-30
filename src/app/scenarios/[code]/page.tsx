import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatCard from "@/components/ui/StatCard";
import { formatNumber } from "@/lib/utils";

type ScenarioCard = {
  card_code: string;
  sphere_code: string;
  subsphere: string | null;
  short_title: string | null;
  role_fragment: string;
  role_class: "core" | "procedural" | "noise" | "disputed" | "uncategorized";
  requirement_type: string | null;
  specificity: "concrete" | "framework" | "referential" | "principle" | null;
  mandatory_level: string | null;
  timing: string | null;
  frequency: string | null;
  evidence_required: string | null;
  consequences: string | null;
  life_cycle_stage: string | null;
  confidence: number | null;
  is_required: boolean;
  ordering: number;
  notes: string | null;
};

type ScenarioData = {
  code: string;
  title: string;
  description: string;
  spheres: string[];
  subcategory: string;
  is_published: boolean;
  stats: {
    total_cards: number;
    required: number;
    optional: number;
    concrete: number;
    noise: number;
  };
  cards: ScenarioCard[];
};

const dir = path.join(process.cwd(), "data", "generated", "mvp", "scenarios");

export function generateStaticParams() {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ code: f.replace(".json", "") }));
}

const SPHERE_ICONS: Record<string, string> = {
  ecology: "🌿",
  transport: "🚛",
  land: "🏞️",
};

const STAGE_LABELS: Record<string, string> = {
  planning: "Планирование",
  registration: "Регистрация бизнеса",
  pre_launch: "Перед открытием",
  launch: "Запуск",
  operation: "Текущая деятельность",
  reporting: "Отчётность",
  inspection: "При проверке",
  expansion: "Расширение",
  suspension: "Приостановление",
  closure: "Закрытие",
};

function firstStage(s: string | null): string | null {
  if (!s) return null;
  return s.split(";")[0];
}

function CardItem({ c, index }: { c: ScenarioCard; index: number }) {
  const sphereIcon = SPHERE_ICONS[c.sphere_code] || "•";
  const stage = firstStage(c.life_cycle_stage);
  const stageLabel = stage ? STAGE_LABELS[stage] || stage : null;
  const reqColor = c.is_required
    ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20"
    : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900";

  return (
    <div className={`rounded-xl border p-4 ${reqColor}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-700 ring-1 ring-gray-200 dark:bg-gray-950 dark:text-gray-200 dark:ring-gray-800">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span title={c.sphere_code}>{sphereIcon}</span>
            {c.is_required ? (
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                ★ Обязательно
              </span>
            ) : (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                опц.
              </span>
            )}
            {stageLabel && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {stageLabel}
              </span>
            )}
            {c.requirement_type && (
              <span className="text-gray-500 dark:text-gray-400">{c.requirement_type}</span>
            )}
            <Link
              href={`/cards/${c.card_code}`}
              className="ml-auto font-mono text-[10px] text-gray-400 hover:text-blue-500"
            >
              {c.card_code}
            </Link>
          </div>

          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            {c.short_title}
          </h3>

          {c.notes && (
            <p className="mt-1.5 text-xs text-gray-700 dark:text-gray-300">
              <span className="font-medium text-gray-500 dark:text-gray-400">Когда применимо: </span>
              {c.notes}
            </p>
          )}

          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            {c.timing && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Срок:</span>{" "}
                <span className="text-gray-900 dark:text-gray-200">{c.timing}</span>
              </div>
            )}
            {c.evidence_required && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Чем подтверждается:</span>{" "}
                <span className="text-gray-900 dark:text-gray-200">{c.evidence_required}</span>
              </div>
            )}
            {c.consequences && (
              <div className="sm:col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Если не сделать:</span>{" "}
                <span className="text-rose-700 dark:text-rose-300">{c.consequences}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const fp = path.join(dir, `${code}.json`);
  if (!fs.existsSync(fp)) notFound();
  const data: ScenarioData = JSON.parse(fs.readFileSync(fp, "utf-8"));

  // Группируем по этапам жизненного цикла
  const byStage = new Map<string, ScenarioCard[]>();
  for (const c of data.cards) {
    const stage = firstStage(c.life_cycle_stage) || "operation";
    if (!byStage.has(stage)) byStage.set(stage, []);
    byStage.get(stage)!.push(c);
  }
  const stageOrder = ["planning", "registration", "pre_launch", "launch", "operation", "reporting", "inspection", "expansion", "suspension", "closure"];
  const sortedStages = Array.from(byStage.keys()).sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-500">Обзор</Link>
        <span>/</span>
        <Link href="/scenarios" className="hover:text-blue-500">Сценарии</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{data.title}</span>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-400">{data.code}</span>
          {data.is_published ? (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              опубликован
            </span>
          ) : (
            <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              в разработке
            </span>
          )}
          {data.spheres.map((s) => (
            <span key={s} className="text-base" title={s}>
              {SPHERE_ICONS[s] || "•"}
            </span>
          ))}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{data.title}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{data.description}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon="📋" label="Всего шагов" value={formatNumber(data.stats.total_cards)} />
        <StatCard icon="★" label="Обязательных" value={formatNumber(data.stats.required)} />
        <StatCard icon="?" label="При определённых условиях" value={formatNumber(data.stats.optional)} />
      </div>

      {data.cards.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Маршрут для этого сценария ещё не собран. Будет добавлено в следующем релизе.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedStages.map((stage) => (
            <section key={stage}>
              <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
                {STAGE_LABELS[stage] || stage}
                <span className="ml-2 text-xs font-normal text-gray-500">({byStage.get(stage)!.length})</span>
              </h2>
              <div className="space-y-3">
                {byStage.get(stage)!.map((c, idx) => (
                  <CardItem
                    key={c.card_code}
                    c={c}
                    index={data.cards.findIndex((x) => x.card_code === c.card_code)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
        Это типовой маршрут. Если у вашей деятельности есть особенности — пройдите{" "}
        <Link href="/profile-builder" className="font-medium underline hover:text-blue-700">подбор по профилю</Link>{" "}
        для уточнения списка требований.
      </div>
    </div>
  );
}
