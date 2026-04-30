import fs from "fs";
import path from "path";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

type ScenarioIndexItem = {
  code: string;
  title: string;
  description: string;
  spheres: string[];
  subcategory: string;
  is_published: boolean;
  display_order: number;
  total_cards: number;
  required: number;
  optional: number;
};

const indexPath = path.join(process.cwd(), "data", "generated", "mvp", "scenarios_index.json");

const SPHERE_ICONS: Record<string, string> = {
  ecology: "🌿",
  transport: "🚛",
  land: "🏞️",
};

const SCENARIO_ICONS: Record<string, string> = {
  open_sto: "🔧",
  cargo_carrier: "📦",
  hazardous_waste: "☣️",
  land_construction: "🏗️",
  agro_land_use: "🌾",
  emissions_business: "🏭",
  cross_border_cargo: "🌍",
};

export default function ScenariosIndexPage() {
  let scenarios: ScenarioIndexItem[] = [];
  try {
    scenarios = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  } catch {
    scenarios = [];
  }

  const published = scenarios.filter((s) => s.is_published);
  const draft = scenarios.filter((s) => !s.is_published);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-500">Обзор</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Сценарии для предпринимателя</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Маршруты для предпринимателя
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Готовые сценарии «что нужно сделать, чтобы открыть и вести деятельность». Каждый сценарий — это упорядоченный список требований по этапам.
          Шаги помечены как обязательные (★) или применимые при определённых условиях.
        </p>
      </div>

      {published.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            ✅ Опубликованные ({published.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {published.map((s) => (
              <ScenarioCard key={s.code} s={s} />
            ))}
          </div>
        </section>
      )}

      {draft.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-500 dark:text-gray-400">
            🚧 В разработке ({draft.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {draft.map((s) => (
              <ScenarioCard key={s.code} s={s} muted />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
        <strong>Не нашли подходящий сценарий?</strong>{" "}
        Откройте <Link href="/profile-builder" className="font-medium underline hover:text-blue-700">подбор по профилю</Link> —
        ответьте на 5 вопросов и получите персональный список требований.
      </div>
    </div>
  );
}

function ScenarioCard({ s, muted = false }: { s: ScenarioIndexItem; muted?: boolean }) {
  const icon = SCENARIO_ICONS[s.code] || "📋";
  const opacity = muted ? "opacity-70" : "";
  return (
    <Link
      href={`/scenarios/${s.code}`}
      className={`group block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600 ${opacity}`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-2xl">{icon}</span>
        <div className="flex items-center gap-1">
          {s.spheres.map((sp) => (
            <span key={sp} className="text-base" title={sp}>
              {SPHERE_ICONS[sp] || "•"}
            </span>
          ))}
        </div>
      </div>
      <h3 className="mt-3 text-base font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white">
        {s.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{s.description}</p>
      <div className="mt-4 flex items-center gap-3 text-sm">
        {s.total_cards > 0 ? (
          <>
            <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(s.total_cards)}</span>
            <span className="text-xs text-gray-500">шагов</span>
            <span className="ml-auto text-xs">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">★ {s.required} обязательных</span>
            </span>
          </>
        ) : (
          <span className="text-xs italic text-gray-400">Маршрут ещё не собран</span>
        )}
      </div>
    </Link>
  );
}
