import { join } from 'node:path';
import { readJson } from './csv.mjs';

/** Generator metadata from SF generators.json, keyed by id. */
export function loadMeta(sfRoot) {
  const doc = readJson(join(sfRoot, 'generators.json'));
  return new Map(doc.generators.map((g) => [g.id, g]));
}

/** Display metadata for one generator, with the R-7 fallback for unknown ids. */
export function metaFor(map, id) {
  const g = map.get(id);
  if (!g) {
    return { name: id, language: 'unknown', runtime: 'unknown', category: 'unknown',
             homepage: null, repository: null, license: null, version: null };
  }
  return {
    name: g.name, language: g.language, runtime: g.runtime ? g.runtime.split(' ')[0] : 'unknown',
    category: g.category, homepage: g.homepage ?? null, repository: g.repository ?? null,
    license: g.license ?? null, version: g.version ?? null,
  };
}
