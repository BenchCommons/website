// Builds public/data from the BT result files and the SF generator metadata (spec 001 R-1 to R-8).
// usage: node scripts/build-data.mjs BT_ROOT SF_ROOT OUT_DIR
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BuildError } from './lib/csv.mjs';
import { loadMeta } from './lib/meta.mjs';
import { buildRound, listRounds, roundIndexEntry } from './lib/round.mjs';
import { stableStringify } from './lib/stable.mjs';

const [bt, sf, out] = process.argv.slice(2);

try {
  const meta = loadMeta(sf);
  const dir = join(out, 'rounds');
  mkdirSync(dir, { recursive: true });
  const rounds = [];
  const written = new Set();
  for (const id of listRounds(bt)) {
    const roundDir = join(bt, 'docs/results', id);
    const round = buildRound(roundDir, meta);
    writeFileSync(join(dir, `${id}.json`), stableStringify(round));
    written.add(`${id}.json`);
    rounds.push(roundIndexEntry(round, join(roundDir, 'README.md')));
  }
  for (const f of readdirSync(dir)) if (!written.has(f)) rmSync(join(dir, f));
  writeFileSync(join(out, 'rounds.json'), stableStringify({ schemaVersion: 1, rounds }));
  console.log(`build-data: ${rounds.length} rounds (${rounds.map((r) => r.id).join(', ')})`);
} catch (e) {
  if (!(e instanceof BuildError)) throw e;
  console.error(`build-data: ${e.message}`);
  process.exit(1);
}
