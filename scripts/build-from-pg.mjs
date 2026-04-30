/**
 * build-from-pg.mjs — мост Postgres → статические JSON для Next.js.
 *
 * Читает БД ochistka-mvp-3spheres и генерирует:
 *   data/generated/mvp/cards/{card_code}.json    — каждая карточка целиком
 *   data/generated/mvp/spheres/{sphere}.json     — агрегат по сфере
 *   data/generated/mvp/spheres_index.json        — индекс 3 сфер с метриками
 *   data/generated/mvp/cards_index.json          — короткий индекс всех карточек
 *
 * Использование:
 *   DATABASE_URL=postgresql://... node scripts/build-from-pg.mjs
 *
 * ЗАПИСЬ ИДЁТ В data/generated/mvp/, чтобы не конфликтовать с
 * существующими data/generated/oked/, oked_summary.json и т.д.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "generated", "mvp");

const SPHERE_LABELS = {
  ecology:   "Экология и природопользование",
  transport: "Транспорт",
  land:      "Земля и землепользование",
};

const CORE_ROLES = new Set([
  "обязанность бизнеса",
  "запрет",
  "условие допуска",
  "документ для заявления",
  "доказательство исполнения",
]);
const PROCEDURAL_ROLES = new Set(["процедурная обязанность бизнеса"]);
const NOISE_ROLES = new Set([
  "действие государственного органа",
  "полномочие государственного органа",
  "описательная норма",
  "определение/термин",
]);

function classifyRole(role) {
  if (!role) return "uncategorized";
  if (CORE_ROLES.has(role)) return "core";
  if (PROCEDURAL_ROLES.has(role)) return "procedural";
  if (NOISE_ROLES.has(role)) return "noise";
  return "disputed";
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function fetchAllCards(client) {
  const { rows } = await client.query(`
    SELECT
      rc.id, rc.card_code, rc.sphere_code, rc.subsphere,
      rc.short_title, rc.canonical_text, rc.legal_text, rc.business_text,
      rc.subject, rc.action, rc.object, rc.condition_text, rc.exception_text,
      rc.requirement_type, rc.requirement_subtype, rc.role_fragment,
      rc.regulatory_regime, rc.life_cycle_stage, rc.mandatory_level,
      rc.requirement_specificity,
      rc.timing, rc.frequency, rc.evidence_required, rc.evidence_form,
      rc.consequences, rc.can_be_online, rc.related_service_url,
      rc.is_canonical, rc.duplicate_group_id,
      rc.generated_by, rc.prompt_version, rc.model_confidence,
      rc.expert_status, rc.created_at, rc.updated_at,
      s.name_ru AS sphere_name,
      dg.group_code AS dup_group_code,
      dg.duplicate_type AS dup_type,
      dg.avg_similarity AS dup_avg_sim,
      dg.detected_method AS dup_method
    FROM requirement_cards rc
    LEFT JOIN spheres s ON s.code = rc.sphere_code
    LEFT JOIN duplicate_groups dg ON dg.id = rc.duplicate_group_id
    ORDER BY rc.id
  `);
  return rows;
}

async function fetchDuplicatePeers(client) {
  /** Возвращает Map: card_id → [{card_code, sphere}] (другие карточки в той же группе) */
  const { rows } = await client.query(`
    SELECT rc.id AS card_id, peer.card_code AS peer_code, peer.sphere_code AS peer_sphere,
           peer.short_title AS peer_title
      FROM requirement_cards rc
      JOIN requirement_cards peer
        ON peer.duplicate_group_id = rc.duplicate_group_id
       AND peer.id != rc.id
     WHERE rc.duplicate_group_id IS NOT NULL
  `);
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.card_id)) map.set(r.card_id, []);
    map.get(r.card_id).push({
      card_code: r.peer_code,
      sphere_code: r.peer_sphere,
      short_title: r.peer_title,
    });
  }
  return map;
}

async function fetchRelated(client, table, cardIds) {
  if (cardIds.length === 0) return new Map();
  const { rows } = await client.query(
    `SELECT * FROM ${table} WHERE card_id = ANY($1::int[])`,
    [cardIds]
  );
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.card_id)) map.set(r.card_id, []);
    map.get(r.card_id).push(r);
  }
  return map;
}

async function fetchBurden(client, cardIds) {
  if (cardIds.length === 0) return new Map();
  const { rows } = await client.query(
    `SELECT * FROM burden_metrics WHERE card_id = ANY($1::int[])`,
    [cardIds]
  );
  return new Map(rows.map((r) => [r.card_id, r]));
}

async function fetchSourceFragments(client, cardIds) {
  if (cardIds.length === 0) return new Map();
  const { rows } = await client.query(
    `SELECT id, canonical_card_id, source_layer, source_file,
            text_original, npa_title, article_ref, ml_category
       FROM source_fragments
      WHERE canonical_card_id = ANY($1::int[])`,
    [cardIds]
  );
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.canonical_card_id)) map.set(r.canonical_card_id, []);
    map.get(r.canonical_card_id).push(r);
  }
  return map;
}

async function fetchSubsphereCounts(client) {
  const { rows } = await client.query(
    `SELECT * FROM v_subsphere_card_count`
  );
  return rows;
}

async function fetchScenarios(client) {
  const { rows } = await client.query(`
    SELECT s.id, s.code, s.title, s.description, s.spheres, s.subcategory,
           s.profile_template, s.is_published, s.display_order
      FROM scenarios s
     ORDER BY s.display_order
  `);
  return rows;
}

async function fetchScenarioCards(client, scenarioId) {
  const { rows } = await client.query(`
    SELECT
      c.card_code, c.sphere_code, c.subsphere, c.short_title,
      c.role_fragment, c.requirement_type, c.requirement_specificity,
      c.mandatory_level, c.timing, c.frequency,
      c.evidence_required, c.consequences,
      c.life_cycle_stage,
      c.model_confidence,
      sc.is_required, sc.ordering, sc.notes
    FROM scenario_cards sc
    JOIN requirement_cards c ON c.id = sc.card_id
    WHERE sc.scenario_id = $1
    ORDER BY sc.ordering
  `, [scenarioId]);
  return rows;
}

function buildCardObject(card, npaLinks, okvedLinks, applicability, burden, fieldMeta, sources, dupPeers) {
  return {
    card_code: card.card_code,
    sphere: { code: card.sphere_code, name: card.sphere_name },
    subsphere: card.subsphere,

    titles: {
      short: card.short_title,
      canonical: card.canonical_text,
      legal: card.legal_text,
      business: card.business_text,
    },

    structure: {
      subject: card.subject,
      action: card.action,
      object: card.object,
      condition: card.condition_text,
      exception: card.exception_text,
    },

    classification: {
      requirement_type: card.requirement_type,
      requirement_subtype: card.requirement_subtype,
      role_fragment: card.role_fragment,
      role_class: classifyRole(card.role_fragment),
      regulatory_regime: card.regulatory_regime,
      life_cycle_stage: card.life_cycle_stage,
      mandatory_level: card.mandatory_level,
      specificity: card.requirement_specificity,
    },

    execution: {
      timing: card.timing,
      frequency: card.frequency,
      evidence_required: card.evidence_required,
      evidence_form: card.evidence_form,
      consequences: card.consequences,
      can_be_online: card.can_be_online,
      related_service_url: card.related_service_url,
    },

    npa_links: (npaLinks || []).map((n) => ({
      title: n.npa_title,
      article_ref: n.article_ref,
      url: n.npa_url,
      fragment_text: n.fragment_text,
      relation_status: n.relation_status,
      confidence: n.confidence !== null ? Number(n.confidence) : null,
    })),

    okved_links: (okvedLinks || []).map((o) => ({
      okved_id: o.okved_id,
      link_type: o.link_type,
      confidence: o.confidence !== null ? Number(o.confidence) : null,
      source_note: o.source_note,
    })),

    applicability_rules: (applicability || []).map((a) => ({
      yaml: a.rule_yaml,
      json: a.rule_json,
      notes: a.notes,
    })),

    burden: burden ? {
      is_periodic: burden.is_periodic,
      frequency_per_year: burden.frequency_per_year !== null ? Number(burden.frequency_per_year) : null,
      num_documents: burden.num_documents,
      num_authorities: burden.num_authorities,
      num_actions: burden.num_actions,
      estimated_cost_kzt: burden.estimated_cost_kzt !== null ? Number(burden.estimated_cost_kzt) : null,
      waiting_days: burden.waiting_days,
      validity_days: burden.validity_days,
      fine_risk: burden.fine_risk,
      suspension_risk: burden.suspension_risk,
      refusal_risk: burden.refusal_risk,
      needs_external_spec: burden.needs_external_spec,
      needs_equipment: burden.needs_equipment,
      needs_premises: burden.needs_premises,
      burden_index: burden.burden_index !== null ? Number(burden.burden_index) : null,
    } : null,

    field_metadata: (fieldMeta || []).map((f) => ({
      field: f.field_name,
      value: f.value_text,
      source: f.source,
      method: f.method,
      confidence: f.confidence !== null ? Number(f.confidence) : null,
      explanation: f.explanation,
      check_status: f.check_status,
    })),

    sources: (sources || []).map((s) => ({
      fragment_id: s.id,
      source_layer: s.source_layer,
      source_file: s.source_file,
      text_preview: (s.text_original || "").slice(0, 200),
      npa_title: s.npa_title,
      article_ref: s.article_ref,
      ml_category: s.ml_category,
    })),

    duplicate_alert: card.dup_group_code ? {
      group_code: card.dup_group_code,
      duplicate_type: card.dup_type,
      avg_similarity: card.dup_avg_sim !== null ? Number(card.dup_avg_sim) : null,
      detected_method: card.dup_method,
      peers: (dupPeers || []).map((p) => ({
        card_code: p.card_code,
        sphere_code: p.sphere_code,
        short_title: p.short_title,
      })),
    } : null,

    meta: {
      generated_by: card.generated_by,
      prompt_version: card.prompt_version,
      model_confidence: card.model_confidence !== null ? Number(card.model_confidence) : null,
      expert_status: card.expert_status,
      created_at: card.created_at,
      updated_at: card.updated_at,
    },
  };
}

function buildShortCard(card) {
  return {
    card_code: card.card_code,
    sphere_code: card.sphere_code,
    subsphere: card.subsphere,
    short_title: card.short_title,
    role_fragment: card.role_fragment,
    role_class: classifyRole(card.role_fragment),
    requirement_type: card.requirement_type,
    mandatory_level: card.mandatory_level,
    specificity: card.requirement_specificity,
    confidence: card.model_confidence !== null ? Number(card.model_confidence) : null,
    has_duplicate_alert: !!card.dup_group_code,
  };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL is not set");
    process.exit(1);
  }

  await ensureDir(path.join(OUT_DIR, "cards"));
  await ensureDir(path.join(OUT_DIR, "spheres"));
  await ensureDir(path.join(OUT_DIR, "scenarios"));

  // Railway public proxy uses self-signed cert. Снимаем sslmode из URL и
  // принудительно ставим SSL без верификации (это безопасно для local-build:
  // мы коннектимся к public proxy через TLS, проверка цепочки сертификатов не
  // даёт дополнительной защиты от MITM при использовании облачного proxy).
  const cleanUrl = url.replace(/[?&]sslmode=[^&]+/g, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log(`[build-from-pg] connected: ${url.slice(0, 40)}...`);

  // 1) Fetch everything
  const cards = await fetchAllCards(client);
  const cardIds = cards.map((c) => c.id);
  console.log(`[build-from-pg] cards: ${cards.length}`);

  const npaMap = await fetchRelated(client, "npa_links", cardIds);
  const okvedMap = await fetchRelated(client, "okved_links", cardIds);
  const applMap = await fetchRelated(client, "applicability_rules", cardIds);
  const fmMap = await fetchRelated(client, "field_metadata", cardIds);
  const burdenMap = await fetchBurden(client, cardIds);
  const sourcesMap = await fetchSourceFragments(client, cardIds);
  const subsphereCounts = await fetchSubsphereCounts(client);
  const dupPeersMap = await fetchDuplicatePeers(client);

  // 2) Per-card files
  let written = 0;
  for (const c of cards) {
    const obj = buildCardObject(
      c,
      npaMap.get(c.id),
      okvedMap.get(c.id),
      applMap.get(c.id),
      burdenMap.get(c.id),
      fmMap.get(c.id),
      sourcesMap.get(c.id),
      dupPeersMap.get(c.id)
    );
    const fp = path.join(OUT_DIR, "cards", `${c.card_code}.json`);
    await fs.writeFile(fp, JSON.stringify(obj, null, 2), "utf-8");
    written++;
  }
  console.log(`[build-from-pg] cards files: ${written}`);

  // 3) Per-sphere files
  const bySphere = new Map();
  for (const c of cards) {
    if (!bySphere.has(c.sphere_code)) bySphere.set(c.sphere_code, []);
    bySphere.get(c.sphere_code).push(c);
  }

  const sphereIndex = [];
  for (const [sphereCode, sphereCards] of bySphere.entries()) {
    const roleClassCounts = { core: 0, procedural: 0, noise: 0, disputed: 0, uncategorized: 0 };
    const specificityCounts = { concrete: 0, framework: 0, referential: 0, principle: 0, none: 0 };
    const businessRouteCount = { value: 0 };  // ядро + concrete = реально для портала
    const roleCounts = {};
    const subsphereCardMap = {};

    for (const c of sphereCards) {
      const cls = classifyRole(c.role_fragment);
      roleClassCounts[cls]++;
      specificityCounts[c.requirement_specificity || "none"]++;
      if (cls === "core" && c.requirement_specificity === "concrete") {
        businessRouteCount.value++;
      }
      const role = c.role_fragment || "(не задано)";
      roleCounts[role] = (roleCounts[role] || 0) + 1;

      const sub = c.subsphere || "(без подсферы)";
      if (!subsphereCardMap[sub]) subsphereCardMap[sub] = [];
      subsphereCardMap[sub].push(buildShortCard(c));
    }

    const subspheresList = Object.entries(subsphereCardMap)
      .map(([name, cards]) => ({ name, count: cards.length, cards }))
      .sort((a, b) => b.count - a.count);

    const sphereSubsphereDict = subsphereCounts
      .filter((s) => s.sphere_code === sphereCode)
      .map((s) => ({
        code: s.subsphere_code,
        name: s.subsphere_name,
        is_business_facing: s.is_business_facing,
        display_order: s.display_order,
        cards_count: Number(s.cards_count),
        business_facing_cards: Number(s.business_facing_cards),
      }));

    const sphereData = {
      sphere_code: sphereCode,
      sphere_name: SPHERE_LABELS[sphereCode] || sphereCode,
      total_cards: sphereCards.length,
      role_class_counts: roleClassCounts,
      specificity_counts: specificityCounts,
      business_route_count: businessRouteCount.value,
      role_counts: roleCounts,
      subspheres_in_data: subspheresList,
      subsphere_dict: sphereSubsphereDict,
    };

    const fp = path.join(OUT_DIR, "spheres", `${sphereCode}.json`);
    await fs.writeFile(fp, JSON.stringify(sphereData, null, 2), "utf-8");
    sphereIndex.push({
      code: sphereCode,
      name: SPHERE_LABELS[sphereCode] || sphereCode,
      total_cards: sphereCards.length,
      core: roleClassCounts.core,
      procedural: roleClassCounts.procedural,
      noise: roleClassCounts.noise,
      business_route: businessRouteCount.value,
      specificity: specificityCounts,
    });
  }

  // Add the spheres that have no cards yet
  for (const code of Object.keys(SPHERE_LABELS)) {
    if (!sphereIndex.find((s) => s.code === code)) {
      sphereIndex.push({
        code,
        name: SPHERE_LABELS[code],
        total_cards: 0,
        core: 0,
        procedural: 0,
        noise: 0,
        business_route: 0,
        specificity: { concrete: 0, framework: 0, referential: 0, principle: 0, none: 0 },
      });
      const fp = path.join(OUT_DIR, "spheres", `${code}.json`);
      await fs.writeFile(fp, JSON.stringify({
        sphere_code: code,
        sphere_name: SPHERE_LABELS[code],
        total_cards: 0,
        role_class_counts: { core: 0, procedural: 0, noise: 0, disputed: 0, uncategorized: 0 },
        specificity_counts: { concrete: 0, framework: 0, referential: 0, principle: 0, none: 0 },
        business_route_count: 0,
        role_counts: {},
        subspheres_in_data: [],
        subsphere_dict: subsphereCounts
          .filter((s) => s.sphere_code === code)
          .map((s) => ({
            code: s.subsphere_code,
            name: s.subsphere_name,
            is_business_facing: s.is_business_facing,
            display_order: s.display_order,
            cards_count: 0,
            business_facing_cards: 0,
          })),
      }, null, 2), "utf-8");
    }
  }

  await fs.writeFile(
    path.join(OUT_DIR, "spheres_index.json"),
    JSON.stringify(sphereIndex, null, 2),
    "utf-8"
  );

  // 4) Cards index
  const cardsIndex = cards.map(buildShortCard);
  await fs.writeFile(
    path.join(OUT_DIR, "cards_index.json"),
    JSON.stringify(cardsIndex, null, 2),
    "utf-8"
  );

  // Source fragments aggregate (для будущих /sources страниц)
  const fragSummary = await client.query(`
    SELECT sphere_code, source_layer, COUNT(*)::int AS cnt
      FROM source_fragments
     WHERE sphere_code IS NOT NULL
     GROUP BY sphere_code, source_layer
     ORDER BY sphere_code, source_layer
  `);
  await fs.writeFile(
    path.join(OUT_DIR, "fragments_summary.json"),
    JSON.stringify(fragSummary.rows, null, 2),
    "utf-8"
  );

  // 5) Scenarios index + per-scenario files
  const scenarios = await fetchScenarios(client);
  const scenariosIndex = [];
  for (const sc of scenarios) {
    const scCards = await fetchScenarioCards(client, sc.id);
    const requiredCount = scCards.filter((c) => c.is_required).length;
    const optionalCount = scCards.length - requiredCount;
    const concreteCount = scCards.filter((c) => c.requirement_specificity === "concrete").length;
    const noiseCount = scCards.filter((c) => classifyRole(c.role_fragment) === "noise").length;

    const scenarioObj = {
      code: sc.code,
      title: sc.title,
      description: sc.description,
      spheres: sc.spheres,
      subcategory: sc.subcategory,
      is_published: sc.is_published,
      display_order: sc.display_order,
      stats: {
        total_cards: scCards.length,
        required: requiredCount,
        optional: optionalCount,
        concrete: concreteCount,
        noise: noiseCount,
      },
      cards: scCards.map((c) => ({
        card_code: c.card_code,
        sphere_code: c.sphere_code,
        subsphere: c.subsphere,
        short_title: c.short_title,
        role_fragment: c.role_fragment,
        role_class: classifyRole(c.role_fragment),
        requirement_type: c.requirement_type,
        specificity: c.requirement_specificity,
        mandatory_level: c.mandatory_level,
        timing: c.timing,
        frequency: c.frequency,
        evidence_required: c.evidence_required,
        consequences: c.consequences,
        life_cycle_stage: c.life_cycle_stage,
        confidence: c.model_confidence !== null ? Number(c.model_confidence) : null,
        is_required: c.is_required,
        ordering: c.ordering,
        notes: c.notes,
      })),
    };

    await fs.writeFile(
      path.join(OUT_DIR, "scenarios", `${sc.code}.json`),
      JSON.stringify(scenarioObj, null, 2),
      "utf-8"
    );

    scenariosIndex.push({
      code: sc.code,
      title: sc.title,
      description: sc.description,
      spheres: sc.spheres,
      subcategory: sc.subcategory,
      is_published: sc.is_published,
      display_order: sc.display_order,
      total_cards: scCards.length,
      required: requiredCount,
      optional: optionalCount,
    });
  }

  await fs.writeFile(
    path.join(OUT_DIR, "scenarios_index.json"),
    JSON.stringify(scenariosIndex, null, 2),
    "utf-8"
  );

  await client.end();

  console.log(`[build-from-pg] DONE`);
  console.log(`  cards files:     ${written}`);
  console.log(`  spheres files:   ${Object.keys(SPHERE_LABELS).length}`);
  console.log(`  scenarios files: ${scenariosIndex.length}`);
  console.log(`  output dir:      ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
