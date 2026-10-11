// URL hash state (spec R-9). Every view is a link: decode validates per key, encode omits defaults.
export const SECTIONS = ['intro', 'results', 'quality', 'environment', 'rounds'];
export const VIEWS = ['chart', 'table', 'composite'];
export const FILTER_KEYS = ['lang', 'runtime', 'category', 'status'];

function params(hash) {
  const out = {};
  for (const part of (hash || '').replace(/^#/, '').split('&')) {
    if (!part) continue;
    const i = part.indexOf('=');
    const k = i < 0 ? part : part.slice(0, i);
    out[k] = i < 0 ? '' : part.slice(i + 1);
  }
  return out;
}

const dec = (v) => {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};
const list = (v) => [...new Set((v || '').split(',').filter(Boolean).map(dec))].sort();

/** First cell id of a suite in a loaded round, or null. */
function cellsOf(round, suite) {
  return round?.suites?.[suite]?.cells?.map((c) => c.id) ?? [];
}

/**
 * Reads a hash into state. `round` is the loaded round file, or null before it loads:
 * suite is checked against the index, and cell only once the round is known.
 */
export function decode(hash, index, round) {
  const p = params(hash);
  const ids = index.rounds.map((r) => r.id);
  const roundId = ids.includes(dec(p.round ?? '')) ? dec(p.round) : ids[0] ?? null;
  const entry = index.rounds.find((r) => r.id === roundId);
  const suites = entry?.suites ?? [];
  const suite = suites.includes(p.suite) ? p.suite : suites[0] ?? null;
  let cell = p.cell ? dec(p.cell) : null;
  if (round && round.id === roundId) {
    const cells = cellsOf(round, suite);
    if (!cells.includes(cell)) cell = cells[0] ?? null;
  }
  const compare = p.compare && ids.includes(dec(p.compare)) && dec(p.compare) !== roundId ? dec(p.compare) : null;
  return {
    section: SECTIONS.includes(p.section) ? p.section : 'results',
    round: roundId,
    suite,
    cell,
    view: VIEWS.includes(p.view) ? p.view : 'chart',
    compare,
    filters: Object.fromEntries(FILTER_KEYS.map((k) => [k, list(p[k])])),
  };
}

/** Writes state as a hash. The round is always written so a link keeps pointing at it. */
export function encode(state, round) {
  const parts = [];
  const add = (k, v) => parts.push(`${k}=${encodeURIComponent(v)}`);
  if (state.section !== 'results') add('section', state.section);
  if (state.round) add('round', state.round);
  const suites = round ? Object.keys(round.suites) : [];
  const firstSuite = ['P', 'M', 'G', 'GG'].find((s) => suites.includes(s));
  if (state.suite && state.suite !== firstSuite) add('suite', state.suite);
  if (state.cell && state.cell !== cellsOf(round, state.suite)[0]) add('cell', state.cell);
  if (state.view !== 'chart') add('view', state.view);
  if (state.compare) add('compare', state.compare);
  for (const k of FILTER_KEYS) {
    const v = state.filters?.[k] ?? [];
    if (v.length) parts.push(`${k}=${[...v].sort().map(encodeURIComponent).join(',')}`);
  }
  return '#' + parts.join('&');
}
