// Filter panel logic (spec R-13). Filters hide rows; ranks were assigned over the whole cell.
const FIELD = { lang: 'language', runtime: 'runtime', category: 'category' };

export const statusOf = (row) => row.kind ?? 'ok';

function value(key, row, generators) {
  if (key === 'status') return statusOf(row);
  return generators[row.framework]?.[FIELD[key]] ?? 'unknown';
}

/** Sorted distinct values of each filter group over the given rows. */
export function facets(rows, generators) {
  const out = {};
  for (const k of ['lang', 'runtime', 'category', 'status']) {
    out[k] = [...new Set(rows.map((r) => value(k, r, generators)))].sort((a, b) =>
      k === 'status' && a === 'ok' ? -1 : k === 'status' && b === 'ok' ? 1 : a.localeCompare(b));
  }
  return out;
}

/** Rows matching every group with a selection; an empty group selects everything. */
export function applyFilters(rows, generators, filters) {
  return rows.filter((r) =>
    Object.entries(filters).every(([k, sel]) => !sel?.length || sel.includes(value(k, r, generators))));
}
