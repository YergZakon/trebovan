/**
 * CSV → JSON data preparation script
 * Reads raw CSV files and generates pre-computed JSON for the dashboard
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gunzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW = join(__dirname, '..', 'data', 'raw');
const OUT = join(__dirname, '..', 'data', 'generated');

// ─── Helpers ────────────────────────────────────────────
function parseCSV(text, sep = ',') {
  const lines = text.split('\n').filter(l => l.trim());
  const headers = parseLine(lines[0], sep);
  return lines.slice(1).map(line => {
    const vals = parseLine(line, sep);
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = (vals[i] || '').trim());
    return obj;
  });
}

function parseLine(line, sep) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function readCSV(filename, sep = ',', encoding = 'utf-8') {
  const raw = readFileSync(join(RAW, filename));
  let text;
  if (encoding === 'utf-16') {
    text = raw.toString('utf16le');
    // Remove BOM
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  } else {
    text = raw.toString(encoding);
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  }
  return parseCSV(text, sep);
}

function readGzipCSV(filename) {
  const compressed = readFileSync(join(RAW, filename));
  const text = gunzipSync(compressed).toString('utf-8');
  if (text.charCodeAt(0) === 0xFEFF) return parseCSV(text.slice(1));
  return parseCSV(text);
}

function writeJSON(path, data) {
  const fullPath = join(OUT, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, JSON.stringify(data));
}

function writeJSONPretty(path, data) {
  const fullPath = join(OUT, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

// ─── OKED Section Mapping ───────────────────────────────
const SECTION_RANGES = [
  [6, 107, 'A'], [112, 175, 'B'], [180, 923, 'C'],
  [928, 954, 'D'], [959, 985, 'E'], [990, 1056, 'F'],
  [1061, 1365, 'G'], [1370, 1452, 'H'], [1456, 1481, 'I'],
  [1503, 1565, 'J'], [1570, 1627, 'K'], [1632, 1645, 'L'],
  [1650, 1736, 'M'], [1741, 1852, 'N'], [1875, 1920, 'P'],
  [1924, 1945, 'Q'], [1950, 1994, 'R'], [1999, 2051, 'S'],
  [2069, 2090, 'A'], [2091, 2160, 'C'], [2161, 2200, 'G'],
  [2201, 2260, 'J'], [2261, 2300, 'S'],
];

function getSection(okedId) {
  const code = parseInt(okedId);
  if (isNaN(code)) return null;
  for (const [lo, hi, sec] of SECTION_RANGES) {
    if (code >= lo && code <= hi) return sec;
  }
  return null;
}

// ─── Main ───────────────────────────────────────────────
console.log('Loading data...');

// 1. Requirements (64K)
const requirements = readGzipCSV('data_requirements.csv.gz');
console.log(`  Requirements: ${requirements.length}`);

// 2. OKED mapping (sphere -> OKED)
// File has duplicate header "name_ru" — parse by index, not by header name
const mappingText = (() => {
  const raw = readFileSync(join(RAW, 'New Report (8).csv'));
  let t = raw.toString('utf16le');
  if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
  return t;
})();
const mappingLines = mappingText.split('\n').filter(l => l.trim());
const mapping = mappingLines.slice(1).map(line => {
  const parts = line.split('\t').map(p => p.trim());
  return {
    sphere_ru: (parts[1] || '').replace(/^[";\s]+|[";\s]+$/g, ''),
    oked_id: (parts[2] || '').trim(),
    oked_name_ru: (parts[3] || '').trim(),
  };
});
console.log(`  Mapping: ${mapping.length}`);

// 3. OKED summary (pre-computed)
const okedSummaryRaw = readCSV('РЕЗУЛЬТАТ_нагрузка_по_ОКЭД.csv');
console.log(`  OKED summary: ${okedSummaryRaw.length}`);

// 4. Business data
const bizSections = readCSV('бизнес_по_секциям.csv');
console.log(`  Business sections: ${bizSections.length}`);

// 5. Duplicates
const dupsSummary = readCSV('дубликаты_сводка.csv');
const crossPairs = readCSV('РЕЗУЛЬТАТ_сводка_кросс_пары_сфер.csv');
console.log(`  Cross pairs: ${crossPairs.length}`);

// 6. Employment data (workers by section, thousands)
const employment = readCSV('занятость_по_секциям.csv');
console.log(`  Employment sections: ${employment.length}`);
const employmentBySection = {};
for (const e of employment) {
  employmentBySection[e.section] = parseFloat(e.workers_thousands || 0);
}

// 6. Load types
const loadTypesSummary = readCSV('требования_типы_нагрузки_сводка.csv');

// ─── Build indexes ──────────────────────────────────────
console.log('Building indexes...');

// OKED -> set of spheres
const okedToSpheres = {};
const okedNames = {};
for (const m of mapping) {
  if (!okedToSpheres[m.oked_id]) okedToSpheres[m.oked_id] = new Set();
  okedToSpheres[m.oked_id].add(m.sphere_ru);
  okedNames[m.oked_id] = m.oked_name_ru;
}

// Sphere -> requirements
const sphereReqs = {};
for (const r of requirements) {
  const sphere = r.sphere_ru;
  if (!sphereReqs[sphere]) sphereReqs[sphere] = [];
  sphereReqs[sphere].push(r);
}

// Unique authorities and spheres
const allAuthorities = new Set(requirements.map(r => r.authority_ru));
const allSpheres = new Set(requirements.map(r => r.sphere_ru));

// ─── Compute per-OKED metrics + IRK ────────────────────
console.log('Computing IRK...');

const okedDetails = [];
let maxIRK = 0;

for (const [okedId, sphereSet] of Object.entries(okedToSpheres)) {
  const spheres = [...sphereSet];
  let totalReqs = 0;
  const authorities = new Set();
  const byLoadType = {};
  const bySphere = [];
  const byAuthority = {};

  for (const sphere of spheres) {
    const reqs = sphereReqs[sphere] || [];
    const sphereAuthorities = new Set();
    let sphereCount = 0;

    for (const r of reqs) {
      totalReqs++;
      authorities.add(r.authority_ru);
      sphereAuthorities.add(r.authority_ru);
      sphereCount++;
      const lt = r.load_type_primary_ru || 'Не определено';
      byLoadType[lt] = (byLoadType[lt] || 0) + 1;
      byAuthority[r.authority_ru] = (byAuthority[r.authority_ru] || 0) + 1;
    }

    bySphere.push({
      name: sphere,
      count: sphereCount,
      authorities: [...sphereAuthorities]
    });
  }

  const numSpheres = spheres.length;
  const numAuthorities = authorities.size;
  const irk = totalReqs * numSpheres * numAuthorities;
  if (irk > maxIRK) maxIRK = irk;

  const section = getSection(okedId);

  okedDetails.push({
    oked_id: okedId,
    oked_name_ru: okedNames[okedId] || '',
    total_requirements: totalReqs,
    num_spheres: numSpheres,
    num_authorities: numAuthorities,
    irk_raw: irk,
    section,
    by_load_type: byLoadType,
    by_sphere: bySphere.sort((a, b) => b.count - a.count),
    by_authority: Object.entries(byAuthority)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  });
}

// Normalize IRK and add rank
okedDetails.sort((a, b) => b.total_requirements - a.total_requirements);
okedDetails.forEach((o, i) => {
  o.rank = i + 1;
  o.irk_normalized = maxIRK > 0 ? Math.round(o.irk_raw / maxIRK * 100 * 100) / 100 : 0;
  o.irk_log = o.irk_raw > 0 ? Math.round(Math.log10(o.irk_raw) * 100) / 100 : 0;
});

// Sort by IRK for IRK rank
const irkSorted = [...okedDetails].sort((a, b) => b.irk_raw - a.irk_raw);
irkSorted.forEach((o, i) => { o.irk_rank = i + 1; });

console.log(`  Computed IRK for ${okedDetails.length} OKEDs, max IRK: ${maxIRK}`);

// ─── Generate JSON files ────────────────────────────────
console.log('Writing JSON...');

// 1. Global stats
const bizBySection = {};
for (const b of bizSections) {
  bizBySection[b.section] = b;
}
const totalBusinesses = bizSections.reduce((s, b) => s + parseInt(b.total || 0), 0);

writeJSONPretty('global_stats.json', {
  totalRequirements: requirements.length,
  totalSpheres: allSpheres.size,
  totalOkeds: Object.keys(okedToSpheres).length,
  totalAuthorities: allAuthorities.size,
  totalBusinesses,
  totalDuplicatePairs: dupsSummary
    .filter(d => d.section === 'by_dup_type')
    .reduce((s, d) => s + parseInt(d.count || 0), 0),
  medianRequirements: okedDetails.length > 0
    ? okedDetails[Math.floor(okedDetails.length / 2)].total_requirements
    : 0,
  maxRequirements: okedDetails.length > 0 ? okedDetails[0].total_requirements : 0,
});

// 2. OKED summary (compact, for treemap + table)
writeJSON('oked_summary.json', okedDetails.map(o => {
  const workers = o.section ? (employmentBySection[o.section] || 0) : 0;
  return {
    id: o.oked_id,
    name: o.oked_name_ru,
    reqs: o.total_requirements,
    spheres: o.num_spheres,
    auths: o.num_authorities,
    irk: o.irk_raw,
    irkNorm: o.irk_normalized,
    irkLog: o.irk_log,
    rank: o.rank,
    irkRank: o.irk_rank,
    section: o.section,
    workers,
    reqsPer1000W: workers > 0 ? Math.round(o.total_requirements / workers * 10) / 10 : 0,
  };
}));

// 3. Sections summary
const sectionStats = {};
for (const o of okedDetails) {
  const s = o.section;
  if (!s) continue;
  if (!sectionStats[s]) {
    sectionStats[s] = {
      okeds: 0, totalReqs: 0, totalSpheres: 0,
      totalIRK: 0, maxIRK: 0, loadTypes: {}
    };
  }
  sectionStats[s].okeds++;
  sectionStats[s].totalReqs += o.total_requirements;
  sectionStats[s].totalSpheres += o.num_spheres;
  sectionStats[s].totalIRK += o.irk_raw;
  if (o.irk_raw > sectionStats[s].maxIRK) sectionStats[s].maxIRK = o.irk_raw;
  for (const [lt, cnt] of Object.entries(o.by_load_type)) {
    sectionStats[s].loadTypes[lt] = (sectionStats[s].loadTypes[lt] || 0) + cnt;
  }
}

const sectionsData = bizSections.map(b => {
  const stats = sectionStats[b.section] || {};
  const workers = employmentBySection[b.section] || 0;
  const avgReqs = stats.okeds ? Math.round(stats.totalReqs / stats.okeds) : 0;
  return {
    section: b.section,
    name: b.section_name_ru,
    businesses: {
      total: parseInt(b.total || 0),
      smallLegal: parseInt(b.small_legal || 0),
      mediumLegal: parseInt(b.medium_legal || 0),
      individual: parseInt(b.individual || 0),
      farming: parseInt(b.farming || 0),
    },
    workers, // thousands
    reqsPer1000Workers: workers > 0 ? Math.round(avgReqs / workers * 10) / 10 : 0,
    okeds: stats.okeds || 0,
    totalReqs: stats.totalReqs || 0,
    avgReqs,
    avgSpheres: stats.okeds ? Math.round(stats.totalSpheres / stats.okeds * 10) / 10 : 0,
    irkAvg: stats.okeds ? Math.round(stats.totalIRK / stats.okeds) : 0,
    irkMax: stats.maxIRK || 0,
    loadTypes: stats.loadTypes || {},
  };
});

writeJSONPretty('sections_summary.json', sectionsData);

// 4. Load types
const loadTypes = loadTypesSummary
  .filter(r => r.section === 'by_type' && r.key_2 !== 'Некачественные данные')
  .map(r => ({
    slug: r.key_1,
    name: r.key_2,
    count: parseInt(r.count || 0),
  }))
  .sort((a, b) => b.count - a.count);

const totalLoadTypeCount = loadTypes.reduce((s, l) => s + l.count, 0);
loadTypes.forEach(l => {
  l.percent = Math.round(l.count / totalLoadTypeCount * 1000) / 10;
});

writeJSONPretty('load_types.json', loadTypes);

// 5. Duplicates
const dupsByType = dupsSummary
  .filter(d => d.section === 'by_dup_type')
  .map(d => ({
    type: d.key,
    count: parseInt(d.count || 0),
    avgSim: parseFloat(d.avg_similarity || 0),
  }));

const topSpheresCrossDup = dupsSummary
  .filter(d => d.section === 'top_spheres_cross_dup')
  .map(d => ({
    sphere: d.key,
    count: parseInt(d.count || 0),
  }));

const topSpherePairs = dupsSummary
  .filter(d => d.section === 'top_sphere_pairs')
  .map(d => {
    const parts = d.key.split(' <-> ');
    return {
      sphere1: parts[0] || '',
      sphere2: parts[1] || '',
      count: parseInt(d.count || 0),
    };
  });

const crossPairsData = crossPairs.map(p => ({
  sphere1: p.sphere_1,
  sphere2: p.sphere_2,
  count: parseInt(p.count || 0),
  avgSim: parseFloat(p.avg_sim || 0),
  maxSim: parseFloat(p.max_sim || 0),
})).sort((a, b) => b.count - a.count);

writeJSONPretty('duplicates.json', {
  byType: dupsByType,
  topSpheres: topSpheresCrossDup,
  topPairs: topSpherePairs,
  crossPairs: crossPairsData,
});

// 6. Per-OKED detail files
let okedCount = 0;
for (const o of okedDetails) {
  const bizSection = o.section ? bizBySection[o.section] : null;
  const workers = o.section ? (employmentBySection[o.section] || 0) : 0;
  writeJSON(`oked/${o.oked_id}.json`, {
    id: o.oked_id,
    name: o.oked_name_ru,
    reqs: o.total_requirements,
    spheres: o.num_spheres,
    auths: o.num_authorities,
    irk: o.irk_raw,
    irkNorm: o.irk_normalized,
    irkLog: o.irk_log,
    rank: o.rank,
    irkRank: o.irk_rank,
    section: o.section,
    workers,
    reqsPer1000Workers: workers > 0 ? Math.round(o.total_requirements / workers * 10) / 10 : 0,
    business: bizSection ? {
      name: bizSection.section_name_ru,
      total: parseInt(bizSection.total || 0),
      smallLegal: parseInt(bizSection.small_legal || 0),
      mediumLegal: parseInt(bizSection.medium_legal || 0),
      individual: parseInt(bizSection.individual || 0),
      farming: parseInt(bizSection.farming || 0),
    } : null,
    bySphere: o.by_sphere.map(s => ({
      name: s.name,
      count: s.count,
      auths: s.authorities,
    })),
    byLoadType: Object.entries(o.by_load_type)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    byAuthority: o.by_authority.slice(0, 20),
  });
  okedCount++;
}

console.log(`  Generated ${okedCount} OKED detail files`);
console.log('Done!');
