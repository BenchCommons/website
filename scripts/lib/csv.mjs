import { readFileSync } from 'node:fs';
import { csvParse } from 'd3-dsv';

export class BuildError extends Error {
  name = 'BuildError';
}

/** Reads a CSV file into row objects and checks that every required column exists. */
export function readCsv(path, required) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    throw new BuildError(`${path}: ${e.message}`);
  }
  const rows = csvParse(text);
  for (const c of required) {
    if (!rows.columns.includes(c)) throw new BuildError(`${path}: missing column ${c}`);
  }
  return rows.map((r) => ({ ...r }));
}

/** Reads a JSON file; a missing or broken file is a BuildError naming it. */
export function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new BuildError(`${path}: ${e.message}`);
  }
}
