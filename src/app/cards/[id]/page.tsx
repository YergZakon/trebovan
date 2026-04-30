import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNumber } from "@/lib/utils";

type CardData = {
  card_code: string;
  sphere: { code: string; name: string };
  subsphere: string | null;
  titles: { short?: string; canonical: string; legal?: string; business?: string };
  structure: { subject: string; action: string; object: string; condition: string | null; exception: string | null };
  classification: {
    requirement_type: string;
    requirement_subtype: string | null;
    role_fragment: string;
    role_class: string;
    regulatory_regime: string;
    life_cycle_stage: string | null;
    mandatory_level: string | null;
    specificity: "concrete" | "framework" | "referential" | "principle" | null;
  };
  execution: {
    timing: string | null;
    frequency: string | null;
    evidence_required: string | null;
    evidence_form: string | null;
    consequences: string | null;
    can_be_online: boolean | null;
    related_service_url: string | null;
  };
  npa_links: {
    title: string;
    article_ref: string | null;
    url: string | null;
    fragment_text: string | null;
    relation_status: string;
    confidence: number | null;
  }[];
  okved_links: { okved_id: string; link_type: string; confidence: number | null; source_note: string | null }[];
  applicability_rules: { yaml: string | null; json: unknown; notes: string | null }[];
  burden: {
    is_periodic: boolean | null;
    frequency_per_year: number | null;
    num_documents: number | null;
    num_authorities: number | null;
    num_actions: number | null;
    estimated_cost_kzt: number | null;
    waiting_days: number | null;
    validity_days: number | null;
    fine_risk: string | null;
    suspension_risk: string | null;
    refusal_risk: string | null;
    needs_external_spec: boolean | null;
    needs_equipment: boolean | null;
    needs_premises: boolean | null;
    burden_index: number | null;
  } | null;
  field_metadata: {
    field: string;
    value: string | null;
    source: string | null;
    method: string | null;
    confidence: number | null;
    explanation: string | null;
    check_status: string | null;
  }[];
  sources: {
    fragment_id: number;
    source_layer: string;
    source_file: string | null;
    text_preview: string;
    npa_title: string | null;
    article_ref: string | null;
    ml_category: string | null;
  }[];
  meta: {
    generated_by: string;
    prompt_version: string;
    model_confidence: number | null;
    expert_status: string;
    created_at: string;
    updated_at: string;
  };
  duplicate_alert: {
    group_code: string;
    duplicate_type: string;
    avg_similarity: number | null;
    detected_method: string;
    peers: { card_code: string; sphere_code: string; short_title: string | null }[];
  } | null;
};

const cardsDir = path.join(process.cwd(), "data", "generated", "mvp", "cards");

export function generateStaticParams() {
  if (!fs.existsSync(cardsDir)) return [];
  return fs
    .readdirSync(cardsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ id: f.replace(".json", "") }));
}

const ROLE_CLASS_BADGE: Record<string, { label: string; cls: string; emoji: string }> = {
  core:          { label: "Требование к предпринимателю", cls: "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300", emoji: "🟢" },
  procedural:    { label: "Действие при проверке",        cls: "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300", emoji: "🟡" },
  noise:         { label: "Процедура госоргана",          cls: "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300", emoji: "🏛️" },
  disputed:      { label: "Спорная норма",                cls: "bg-violet-50 border-violet-300 text-violet-800 dark:bg-violet-950/40 dark:border-violet-700 dark:text-violet-300", emoji: "⚖️" },
  uncategorized: { label: "Не классифицировано",          cls: "bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300", emoji: "❓" },
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 sm:col-span-1">{k}</div>
      <div className="text-sm text-gray-900 dark:text-white sm:col-span-2">{v ?? <span className="text-gray-400">—</span>}</div>
    </div>
  );
}

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fp = path.join(cardsDir, `${id}.json`);
  if (!fs.existsSync(fp)) notFound();

  const c: CardData = JSON.parse(fs.readFileSync(fp, "utf-8"));
  const badge = ROLE_CLASS_BADGE[c.classification.role_class] || ROLE_CLASS_BADGE.uncategorized;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-500">Обзор</Link>
        <span>/</span>
        <Link href="/spheres" className="hover:text-blue-500">MVP по 3 сферам</Link>
        <span>/</span>
        <Link href={`/spheres/${c.sphere.code}`} className="hover:text-blue-500">{c.sphere.name}</Link>
        <span>/</span>
        <span className="font-mono text-gray-900 dark:text-white">{c.card_code}</span>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
            {badge.emoji} {c.classification.role_fragment}
          </span>
          {c.classification.requirement_type && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {c.classification.requirement_type}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
          {c.titles.short || c.titles.canonical.slice(0, 120) + (c.titles.canonical.length > 120 ? "…" : "")}
        </h1>
        {c.subsphere && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {c.sphere.name} · <span className="italic">{c.subsphere}</span>
          </p>
        )}
      </div>

      {c.duplicate_alert && c.duplicate_alert.peers.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Похожие требования в реестре ({c.duplicate_alert.peers.length})
              </h2>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                Возможно, это одно и то же требование, повторённое в разных нормативных актах.
              </p>
              <ul className="mt-3 space-y-1">
                {c.duplicate_alert.peers.slice(0, 8).map((p) => (
                  <li key={p.card_code} className="text-sm">
                    <Link href={`/cards/${p.card_code}`} className="text-amber-800 hover:underline dark:text-amber-200">
                      {p.short_title || p.card_code}
                    </Link>
                  </li>
                ))}
                {c.duplicate_alert.peers.length > 8 && (
                  <li className="text-xs italic text-amber-600 dark:text-amber-500">
                    …и ещё {c.duplicate_alert.peers.length - 8}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      <Block title="Формулировки">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Каноническая (нормализованная)</div>
          <div className="mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-900 dark:bg-gray-950/40 dark:text-white">
            {c.titles.canonical}
          </div>
        </div>
        {c.titles.business && (
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Для предпринимателя (упрощённо)</div>
            <div className="mt-1 rounded-md bg-emerald-50 p-3 text-sm text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
              {c.titles.business}
            </div>
          </div>
        )}
        {c.titles.legal && (
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Юридическая (как в норме)</div>
            <div className="mt-1 rounded-md border border-gray-200 p-3 text-sm italic text-gray-700 dark:border-gray-800 dark:text-gray-300">
              «{c.titles.legal}»
            </div>
          </div>
        )}
      </Block>

      {(c.structure.condition || c.structure.exception) && (
        <Block title="Условия и исключения">
          {c.structure.condition && <KV k="Условие" v={c.structure.condition} />}
          {c.structure.exception && <KV k="Исключения" v={c.structure.exception} />}
        </Block>
      )}

      <Block title="Классификация">
        <KV k="Тип требования" v={c.classification.requirement_type} />
        <KV k="Кто должен выполнять" v={c.structure.subject} />
        <KV k="Этап деятельности" v={c.classification.life_cycle_stage} />
        <KV k="Уровень обязательности" v={c.classification.mandatory_level} />
      </Block>

      <Block title="Исполнение">
        <KV k="Срок / периодичность" v={c.execution.timing} />
        <KV k="Частота" v={c.execution.frequency} />
        <KV k="Доказательство" v={c.execution.evidence_required} />
        <KV k="Форма доказательства" v={c.execution.evidence_form} />
        <KV k="Последствия" v={c.execution.consequences} />
        <KV k="Можно онлайн?" v={c.execution.can_be_online === null ? null : c.execution.can_be_online ? "Да" : "Нет"} />
      </Block>

      <Block title={`Связи с НПА (${c.npa_links.length})`}>
        {c.npa_links.length === 0 && <div className="text-gray-400">—</div>}
        {c.npa_links.map((n, i) => (
          <div key={i} className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                {n.relation_status}
              </span>
              {n.confidence !== null && (
                <span className="text-xs text-gray-500">conf {(n.confidence * 100).toFixed(0)}%</span>
              )}
            </div>
            <div className="mt-2 font-medium text-gray-900 dark:text-white">{n.title}</div>
            {n.article_ref && (
              <div className="mt-1 font-mono text-xs text-gray-500">{n.article_ref}</div>
            )}
            {n.fragment_text && (
              <blockquote className="mt-2 border-l-2 border-gray-300 pl-3 text-sm italic text-gray-700 dark:border-gray-700 dark:text-gray-300">
                {n.fragment_text}
              </blockquote>
            )}
          </div>
        ))}
      </Block>

      {c.applicability_rules.length > 0 && c.applicability_rules.some((r) => r.notes) && (
        <Block title="Когда применимо">
          {c.applicability_rules.map((r, i) => (
            r.notes ? (
              <div key={i} className="text-sm text-gray-800 dark:text-gray-200">{r.notes}</div>
            ) : null
          ))}
        </Block>
      )}

      {c.burden && (
        <Block title="Нагрузка на бизнес">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KV k="Документов" v={c.burden.num_documents} />
            <KV k="Органов" v={c.burden.num_authorities} />
            <KV k="Действий" v={c.burden.num_actions} />
            <KV k="Раз/год" v={c.burden.frequency_per_year} />
            <KV k="Риск штрафа" v={c.burden.fine_risk} />
            <KV k="Риск приост." v={c.burden.suspension_risk} />
            <KV k="Риск отказа" v={c.burden.refusal_risk} />
            <KV k="Дни ожидания" v={c.burden.waiting_days} />
          </div>
        </Block>
      )}

    </div>
  );
}
