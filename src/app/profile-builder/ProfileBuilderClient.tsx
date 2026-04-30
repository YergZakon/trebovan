"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type CardIndex = {
  card_code: string;
  sphere_code: string;
  subsphere: string | null;
  short_title: string | null;
  role_fragment: string | null;
  role_class: string;
  requirement_type: string | null;
  mandatory_level: string | null;
  specificity: string | null;
  confidence: number | null;
};

type Profile = {
  // Step 1: что хотите делать
  spheres: string[];
  // Step 2: где
  region: string;
  // Step 3: условия
  has_premises: "yes" | "no" | "";
  has_workers: "yes" | "no" | "";
  hazardous_substances: "yes" | "no" | "";
  waste_handling: "hazardous" | "non_hazardous" | "none" | "";
  emissions: "yes" | "no" | "";
  transport_subtype: string;
  object_category: string;
  // Step 4: жизненный этап
  life_cycle: string[];
  // Step 5: тип субъекта
  subject_type: "individual_entrepreneur" | "legal_entity_too" | "legal_entity_jsc" | "farmer" | "";
};

const SPHERES = [
  { code: "ecology", label: "🌿 Экология", desc: "выбросы, отходы, природопользование" },
  { code: "transport", label: "🚛 Транспорт", desc: "перевозки, морской/ВВТ, авто, ж/д" },
  { code: "land", label: "🏞️ Земля", desc: "землепользование, аренда, пастбища" },
];
const REGIONS = ["almaty", "astana", "shymkent", "oblast"];
const REGION_LABELS: Record<string, string> = {
  almaty: "г. Алматы",
  astana: "г. Астана",
  shymkent: "г. Шымкент",
  oblast: "Любая область",
};
const TRANSPORT_SUBTYPES = [
  { code: "", label: "— не транспорт —" },
  { code: "automobile", label: "Автомобильный" },
  { code: "maritime", label: "Морской" },
  { code: "inland_waterway", label: "Внутренний водный" },
  { code: "railway", label: "Железнодорожный" },
  { code: "aviation", label: "Авиационный" },
  { code: "urban_rail", label: "Городской рельсовый" },
  { code: "pipeline", label: "Магистральный трубопровод" },
];
const OBJECT_CATEGORIES = [
  { code: "", label: "— не специфический объект —" },
  { code: "industrial_general", label: "Промобъект общего назначения (СТО, цех, мастерская)" },
  { code: "food_service", label: "Общепит (кафе, ресторан, столовая)" },
  { code: "food_production", label: "Пищевое производство" },
  { code: "meat_processing", label: "Мясопереработка" },
  { code: "medical", label: "Медицинская организация" },
  { code: "education_kinder", label: "Дошкольная организация (детсад)" },
  { code: "agricultural", label: "Сельхозобъект (поле, ферма)" },
  { code: "pasture", label: "Пастбище" },
  { code: "waste_landfill", label: "Полигон отходов" },
  { code: "hazardous_facility", label: "Опасный производственный объект" },
  { code: "oil_gas_facility", label: "Объект нефтегазовой деятельности" },
];
const LIFE_CYCLE_STAGES = [
  { code: "registration", label: "Регистрация бизнеса" },
  { code: "pre_launch", label: "Подготовка к открытию" },
  { code: "launch", label: "Запуск" },
  { code: "operation", label: "Текущая работа" },
  { code: "reporting", label: "Периодическая отчётность" },
  { code: "inspection", label: "Подготовка к проверке" },
];
const SUBJECT_TYPES = [
  { code: "individual_entrepreneur", label: "Индивидуальный предприниматель" },
  { code: "legal_entity_too", label: "ТОО" },
  { code: "legal_entity_jsc", label: "АО" },
  { code: "farmer", label: "Крестьянское/фермерское хозяйство" },
];

function emptyProfile(): Profile {
  return {
    spheres: [],
    region: "almaty",
    has_premises: "",
    has_workers: "",
    hazardous_substances: "",
    waste_handling: "",
    emissions: "",
    transport_subtype: "",
    object_category: "",
    life_cycle: [],
    subject_type: "",
  };
}

function matchesProfile(c: CardIndex, p: Profile): boolean {
  // 1. Сфера
  if (p.spheres.length > 0 && !p.spheres.includes(c.sphere_code)) return false;

  // 2. Только реальные требования (ядро + concrete) — никаких описательных норм
  if (c.role_class !== "core") return false;
  if (c.specificity && c.specificity !== "concrete") return false;

  // 3. Эвристическая фильтрация по subsphere — отсекаем явно нерелевантные подсферы
  const sub = (c.subsphere || "").toLowerCase();

  if (p.object_category) {
    const objMap: Record<string, string[]> = {
      industrial_general:    ["производств", "СЗЗ", "вентиляц", "помещ", "сточн", "отход"],
      food_service:          ["общепит", "пищев"],
      food_production:       ["пищев", "консерв", "мясо", "колбас", "птиц"],
      meat_processing:       ["мяс", "колбас"],
      medical:               ["медиц", "медучреж"],
      education_kinder:      ["дошкольн", "детсад", "игров"],
      agricultural:          ["с/х", "сельхоз", "пастб", "земельн"],
      pasture:               ["пастб"],
      waste_landfill:        ["полигон", "отход"],
      hazardous_facility:    ["опасн", "ОПО", "радиац", "ОРВ", "биобез"],
      oil_gas_facility:      ["недр", "нефт", "газ", "АСЭП"],
    };
    const keywords = objMap[p.object_category] || [];
    // Если есть ключи, и subsphere не содержит ни одного — пропускаем
    if (keywords.length > 0 && !keywords.some((k) => sub.includes(k.toLowerCase()))) {
      // мягкое исключение: если карточка не специфична для другой объект-категории, оставляем
      const otherCats = Object.entries(objMap).filter(([k]) => k !== p.object_category);
      const fitsOther = otherCats.some(([, kws]) => kws.some((kw) => sub.includes(kw.toLowerCase())));
      if (fitsOther) return false;
    }
  }

  if (p.transport_subtype && c.sphere_code === "transport") {
    const trMap: Record<string, string[]> = {
      automobile:       ["автомоб", "автотр"],
      maritime:         ["морск", "торгов"],
      inland_waterway:  ["внутрен", "водн"],
      railway:          ["железно"],
      aviation:         ["авиа", "воздуш"],
      urban_rail:       ["городск"],
      pipeline:         ["трубопров"],
    };
    const kws = trMap[p.transport_subtype] || [];
    if (kws.length > 0 && !kws.some((k) => sub.includes(k))) return false;
  }

  // 4. Условия применимости — фильтруем явно неприменимое
  if (p.hazardous_substances === "no" && (sub.includes("опасн") || sub.includes("радиац") || sub.includes("ОРВ"))) {
    return false;
  }
  if (p.waste_handling === "none" && sub.includes("отход")) {
    return false;
  }
  if (p.emissions === "no" && (sub.includes("эмисс") || sub.includes("выбрс") || sub.includes("парников"))) {
    return false;
  }
  if (p.has_premises === "no" && sub.includes("помещ")) {
    return false;
  }
  if (p.has_workers === "no" && (sub.includes("работни") || sub.includes("персон") || sub.includes("экипаж"))) {
    return false;
  }

  return true;
}

export default function ProfileBuilderClient({ cards }: { cards: CardIndex[] }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile>(emptyProfile());

  const matched = useMemo(() => {
    if (step < 5) return [];
    return cards.filter((c) => matchesProfile(c, profile));
  }, [cards, profile, step]);

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setProfile((p) => ({ ...p, [k]: v }));
  };

  const toggleSphere = (sphere: string) => {
    setProfile((p) => ({
      ...p,
      spheres: p.spheres.includes(sphere) ? p.spheres.filter((s) => s !== sphere) : [...p.spheres, sphere],
    }));
  };

  const toggleStage = (stage: string) => {
    setProfile((p) => ({
      ...p,
      life_cycle: p.life_cycle.includes(stage) ? p.life_cycle.filter((s) => s !== stage) : [...p.life_cycle, stage],
    }));
  };

  return (
    <div className="space-y-6">
      <Stepper step={step} setStep={setStep} />

      {step === 1 && (
        <StepBlock title="Шаг 1. Что хотите делать?" description="Выберите одну или несколько сфер деятельности.">
          <div className="grid gap-3 md:grid-cols-3">
            {SPHERES.map((s) => {
              const active = profile.spheres.includes(s.code);
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => toggleSphere(s.code)}
                  className={`rounded-lg border p-4 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                  }`}
                >
                  <div className="text-base font-semibold text-gray-900 dark:text-white">{s.label}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.desc}</div>
                </button>
              );
            })}
          </div>
          <NavButtons step={step} setStep={setStep} canNext={profile.spheres.length > 0} />
        </StepBlock>
      )}

      {step === 2 && (
        <StepBlock title="Шаг 2. Где?" description="Регион ведения деятельности (нужен для региональных требований).">
          <div className="grid gap-2 md:grid-cols-4">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => update("region", r)}
                className={`rounded-lg border p-3 text-sm transition ${
                  profile.region === r
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                }`}
              >
                {REGION_LABELS[r]}
              </button>
            ))}
          </div>
          <NavButtons step={step} setStep={setStep} />
        </StepBlock>
      )}

      {step === 3 && (
        <StepBlock title="Шаг 3. Условия деятельности" description="Эти признаки определяют, какие требования к вам применяются.">
          <YesNoRow
            label="Будет ли производственное помещение?"
            value={profile.has_premises}
            onChange={(v) => update("has_premises", v as Profile["has_premises"])}
          />
          <YesNoRow
            label="Будут ли наёмные работники?"
            value={profile.has_workers}
            onChange={(v) => update("has_workers", v as Profile["has_workers"])}
          />
          <YesNoRow
            label="Оборот опасных веществ (хим., радиоактивные, биологические)?"
            value={profile.hazardous_substances}
            onChange={(v) => update("hazardous_substances", v as Profile["hazardous_substances"])}
          />
          <SelectRow
            label="Обращение с отходами?"
            value={profile.waste_handling}
            options={[
              ["", "Не выбрано"],
              ["none", "Без отходов"],
              ["non_hazardous", "Только неопасные (бытовые, упаковка)"],
              ["hazardous", "Опасные (масла, биоотходы, химия)"],
            ]}
            onChange={(v) => update("waste_handling", v as Profile["waste_handling"])}
          />
          <YesNoRow
            label="Выбросы в атмосферу (покрасочная, котельная, автопарк)?"
            value={profile.emissions}
            onChange={(v) => update("emissions", v as Profile["emissions"])}
          />
          {profile.spheres.includes("transport") && (
            <SelectRow
              label="Вид транспорта"
              value={profile.transport_subtype}
              options={TRANSPORT_SUBTYPES.map((t) => [t.code, t.label] as [string, string])}
              onChange={(v) => update("transport_subtype", v)}
            />
          )}
          <SelectRow
            label="Категория объекта"
            value={profile.object_category}
            options={OBJECT_CATEGORIES.map((o) => [o.code, o.label] as [string, string])}
            onChange={(v) => update("object_category", v)}
          />
          <NavButtons step={step} setStep={setStep} />
        </StepBlock>
      )}

      {step === 4 && (
        <StepBlock title="Шаг 4. На каком вы этапе?" description="Выберите этапы — увидите релевантные для них требования.">
          <div className="grid gap-2 md:grid-cols-3">
            {LIFE_CYCLE_STAGES.map((s) => {
              const active = profile.life_cycle.includes(s.code);
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => toggleStage(s.code)}
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    active
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <NavButtons step={step} setStep={setStep} />
        </StepBlock>
      )}

      {step === 5 && (
        <StepBlock title="Шаг 5. Форма бизнеса" description="Тип субъекта (последний вопрос).">
          <div className="grid gap-2 md:grid-cols-2">
            {SUBJECT_TYPES.map((t) => (
              <button
                key={t.code}
                type="button"
                onClick={() => update("subject_type", t.code as Profile["subject_type"])}
                className={`rounded-lg border p-3 text-left text-sm transition ${
                  profile.subject_type === t.code
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <NavButtons step={step} setStep={setStep} canNext={!!profile.subject_type} nextLabel="Показать маршрут" />
        </StepBlock>
      )}

      {step === 6 && (
        <ResultsBlock cards={matched} profile={profile} onReset={() => { setProfile(emptyProfile()); setStep(1); }} />
      )}
    </div>
  );
}

function Stepper({ step, setStep }: { step: number; setStep: (s: number) => void }) {
  const labels = ["Сфера", "Регион", "Условия", "Этап", "Субъект", "Маршрут"];
  return (
    <div className="flex items-center justify-between gap-2">
      {labels.map((label, i) => {
        const idx = i + 1;
        const done = idx < step;
        const current = idx === step;
        return (
          <button
            key={label}
            type="button"
            onClick={() => idx <= step && setStep(idx)}
            disabled={idx > step}
            className={`flex flex-1 items-center gap-2 rounded-lg border p-2 text-xs ${
              current
                ? "border-blue-500 bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                : done
                  ? "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:border-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
                  : "border-gray-200 bg-white text-gray-400 dark:border-gray-800 dark:bg-gray-900"
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${done ? "bg-emerald-500 text-white" : current ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
              {done ? "✓" : idx}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StepBlock({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function NavButtons({ step, setStep, canNext = true, nextLabel = "Дальше" }: { step: number; setStep: (s: number) => void; canNext?: boolean; nextLabel?: string }) {
  return (
    <div className="mt-5 flex items-center justify-between">
      {step > 1 ? (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ← Назад
        </button>
      ) : <span />}
      <button
        type="button"
        onClick={() => setStep(step + 1)}
        disabled={!canNext}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {nextLabel} →
      </button>
    </div>
  );
}

function YesNoRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
      <div className="text-sm text-gray-900 dark:text-white">{label}</div>
      <div className="flex gap-2">
        {[["yes", "Да"], ["no", "Нет"]].map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded px-3 py-1 text-sm font-medium ${
              value === v
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
      <div className="text-sm text-gray-900 dark:text-white">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

function ResultsBlock({ cards, profile, onReset }: { cards: CardIndex[]; profile: Profile; onReset: () => void }) {
  const bySphere = new Map<string, CardIndex[]>();
  for (const c of cards) {
    if (!bySphere.has(c.sphere_code)) bySphere.set(c.sphere_code, []);
    bySphere.get(c.sphere_code)!.push(c);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
        <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
          Ваш персональный список требований: {cards.length}
        </h2>
        <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
          Подобраны требования, применимые к вашей деятельности с учётом сферы, региона и условий.
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          По выбранному профилю требований не найдено. Попробуйте смягчить условия или откройте готовые сценарии.
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(bySphere.entries()).map(([sphere, list]) => (
            <section key={sphere}>
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                {sphere === "ecology" ? "🌿 Экология" : sphere === "transport" ? "🚛 Транспорт" : sphere === "land" ? "🏞️ Земля" : sphere}{" "}
                <span className="text-xs text-gray-500">({list.length})</span>
              </h3>
              <div className="space-y-2">
                {list.map((c) => (
                  <Link
                    key={c.card_code}
                    href={`/cards/${c.card_code}`}
                    className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-gray-400">{c.card_code}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {c.requirement_type}
                      </span>
                      {c.subsphere && (
                        <span className="text-gray-500 dark:text-gray-500">{c.subsphere}</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-900 dark:text-white">
                      {c.short_title}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        ↺ Начать заново
      </button>
    </div>
  );
}
