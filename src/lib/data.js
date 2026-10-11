// Loads the JSON written by scripts/build-data.mjs. Round files are fetched once, when first shown.
const cache = new Map();

async function json(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

export const loadIndex = () => json('data/rounds.json');

export function loadRound(id) {
  if (!cache.has(id)) cache.set(id, json(`data/rounds/${id}.json`).catch((e) => { cache.delete(id); throw e; }));
  return cache.get(id);
}
