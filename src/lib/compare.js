// Round comparison (spec R-16): the same cell in two rounds.
export function compare(cellA, cellB) {
  const a = new Map((cellA?.ok ?? []).map((r) => [r.framework, r.median]));
  const b = new Map((cellB?.ok ?? []).map((r) => [r.framework, r.median]));
  const both = [...a.keys()].filter((k) => b.has(k))
    .map((framework) => ({ framework, a: a.get(framework), b: b.get(framework), ratio: b.get(framework) / a.get(framework) }))
    .sort((x, y) => x.ratio - y.ratio || (x.framework < y.framework ? -1 : 1));
  return {
    both,
    onlyA: [...a.keys()].filter((k) => !b.has(k)).sort(),
    onlyB: [...b.keys()].filter((k) => !a.has(k)).sort(),
  };
}
