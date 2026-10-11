import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[4];
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'rounds.json'), '{"schemaVersion":1,"rounds":[]}\n');
