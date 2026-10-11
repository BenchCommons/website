function sort(v) {
  if (Array.isArray(v)) return v.map(sort);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])]));
  }
  return v;
}

/** JSON with object keys sorted recursively and a trailing newline, so output is byte-stable. */
export function stableStringify(v) {
  return JSON.stringify(sort(v)) + '\n';
}
