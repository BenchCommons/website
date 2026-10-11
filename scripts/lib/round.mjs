import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { classify } from './classify.mjs';
import { BuildError, readCsv, readJson } from './csv.mjs';
import { metaFor } from './meta.mjs';
import { qualityRows } from './quality.mjs';

const SUITES = ['P', 'M', 'G', 'GG'];
const COLUMNS = ['cell', 'framework', 'numberOfFiles', 'contentSize', 'minRuns', 'median', 'min', 'max',
  'status', 'cv', 'postsPerSecond', 'peakRssMB', 'outputFiles', 'fingerprint', 'failureReason'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const num = (x) => (x === '' || x == null ? null : Number(x));
const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Dated round directories in BT docs/results, newest first. */
export function listRounds(btRoot) {
  const dir = join(btRoot, 'docs/results');
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && DATE.test(d.name))
    .map((d) => d.name)
    .sort()
    .reverse();
}

function buildCell(id, rows, generators) {
  const ok = rows.filter((r) => r.status === 'ok')
    .map((r) => ({
      framework: r.framework, median: num(r.median), cv: num(r.cv), min: num(r.min), max: num(r.max),
      postsPerSecond: num(r.postsPerSecond), peakRssMB: num(r.peakRssMB), outputFiles: num(r.outputFiles),
      runs: num(r.minRuns), fingerprint: r.fingerprint || null,
    }))
    .sort((a, b) => a.median - b.median || byId(a.framework, b.framework))
    .map((r, i) => ({ framework: r.framework, rank: i + 1, ...r }));
  const present = new Set(rows.map((r) => r.framework));
  const failed = rows.filter((r) => r.status !== 'ok')
    .sort((a, b) => byId(a.framework, b.framework))
    .map((r) => ({ framework: r.framework, kind: classify(r), reason: r.failureReason || null }));
  for (const g of [...generators].sort()) {
    if (!present.has(g)) failed.push({ framework: g, kind: 'missing', reason: null });
  }
  const first = rows[0];
  return { id, numberOfFiles: num(first.numberOfFiles), contentSize: num(first.contentSize), ok, failed };
}

function cpuModel(lscpu) {
  const m = /^Model name:\s*(.+)$/m.exec(lscpu || '');
  return m ? m[1].trim() : null;
}

function buildEnvironment(results) {
  const first = results[0] || {};
  const env = first.environment || {};
  const owners = new Map();
  const lscpu = {};
  for (const r of results) {
    for (const [fw, fp] of Object.entries(r.fingerprints || {})) {
      if (!owners.has(fp)) owners.set(fp, new Set());
      owners.get(fp).add(fw);
    }
    Object.assign(lscpu, r.environments || {});
  }
  const { image, ...quality } = env.quality || {};
  return {
    runner: first.environmentDescription ?? null,
    cpus: first.resources?.cpus ?? null,
    memoryBytes: first.resources?.memoryBytes ?? null,
    swap: first.resources?.swap ?? null,
    profile: first.profile ?? null,
    toolset: env.toolset?.commit ?? null,
    docker: env.docker?.serverVersion ?? null,
    quality: env.quality ? quality : null,
    fingerprints: [...owners.keys()].sort().map((id) => {
      const fws = [...owners.get(id)].sort();
      const model = fws.map((fw) => cpuModel(lscpu[fw])).find(Boolean);
      return { id, cpuModel: model ?? env.cpuModel ?? null, generators: fws.length };
    }),
  };
}

/** The round file of spec R-4 and the plan's data contract. */
export function buildRound(roundDir, meta) {
  const suites = SUITES.filter((s) => existsSync(join(roundDir, s, 'suite-summary.csv')));
  const rows = Object.fromEntries(suites.map((s) => [s, readCsv(join(roundDir, s, 'suite-summary.csv'), COLUMNS)]));
  const generators = new Set(suites.flatMap((s) => rows[s].map((r) => r.framework)));
  const results = [];
  const out = { schemaVersion: 1, id: basename(roundDir), suites: {}, generators: {}, quality: [] };
  for (const s of suites) {
    const ids = [...new Set(rows[s].map((r) => r.cell))]
      .sort((a, b) => num(rows[s].find((r) => r.cell === a).contentSize) - num(rows[s].find((r) => r.cell === b).contentSize));
    const cells = ids.map((id) => buildCell(id, rows[s].filter((r) => r.cell === id), generators));
    for (const id of ids) {
      const p = join(roundDir, s, id, 'results.json');
      if (existsSync(p)) results.push(readJson(p));
    }
    out.suites[s] = { pages: cells[0]?.numberOfFiles ?? null, cells };
  }
  for (const g of [...generators].sort()) out.generators[g] = metaFor(meta, g);
  out.environment = buildEnvironment(results);
  const withQuality = results.find((r) => r.quality && Object.keys(r.quality).length);
  out.quality = withQuality ? qualityRows(withQuality) : [];
  if (!suites.length) throw new BuildError(`${roundDir}: no suite-summary.csv in any suite`);
  return out;
}

/** The rounds.json entry for a round, with run ids read from its README. */
export function roundIndexEntry(round, readmePath) {
  const runs = {};
  if (existsSync(readmePath)) {
    for (const m of readFileSync(readmePath, 'utf8').matchAll(/^\| (P|M|G|GG) \(.*?actions\/runs\/(\d+)/gm)) {
      runs[m[1]] = m[2];
    }
  }
  return {
    id: round.id, suites: Object.keys(round.suites), generators: Object.keys(round.generators).length,
    runs, hasQuality: round.quality.length > 0,
  };
}
