import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const run = (out) => execFileSync('node', ['scripts/build-data.mjs', 'tests/fixtures/bt', 'tests/fixtures/sf', out], { encoding: 'utf8' });
const files = (dir) => ['rounds.json', ...readdirSync(join(dir, 'rounds')).map((f) => `rounds/${f}`)];

describe('build-data CLI', () => {
  it('writes byte-identical output on two runs', () => {
    const a = mkdtempSync(join(tmpdir(), 'bd-a-'));
    const b = mkdtempSync(join(tmpdir(), 'bd-b-'));
    run(a);
    run(b);
    expect(files(a)).toEqual(['rounds.json', 'rounds/2030-01-01.json']);
    for (const f of files(a)) expect(readFileSync(join(b, f))).toEqual(readFileSync(join(a, f)));
  });

  it('writes the round index with run ids', () => {
    const a = mkdtempSync(join(tmpdir(), 'bd-'));
    run(a);
    const index = JSON.parse(readFileSync(join(a, 'rounds.json'), 'utf8'));
    expect(index.schemaVersion).toBe(1);
    expect(index.rounds).toHaveLength(1);
    expect(index.rounds[0].runs).toEqual({ P: '111', M: '222' });
  });

  it('removes stale round files from its own output', () => {
    const a = mkdtempSync(join(tmpdir(), 'bd-'));
    mkdirSync(join(a, 'rounds'));
    writeFileSync(join(a, 'rounds', '1999-01-01.json'), '{}');
    run(a);
    expect(readdirSync(join(a, 'rounds'))).toEqual(['2030-01-01.json']);
  });

  it('exits 1 with the file name when a result does not parse', () => {
    const bt = mkdtempSync(join(tmpdir(), 'bd-bt-'));
    const d = join(bt, 'docs/results/2030-02-02/P');
    mkdirSync(join(d, 'nf50-cs5'), { recursive: true });
    writeFileSync(join(d, 'suite-summary.csv'), 'cell\nnf50-cs5\n');
    let err;
    try {
      execFileSync('node', ['scripts/build-data.mjs', bt, 'tests/fixtures/sf', mkdtempSync(join(tmpdir(), 'o-'))], { stdio: 'pipe' });
    } catch (e) {
      err = e;
    }
    expect(err.status).toBe(1);
    expect(err.stderr.toString()).toMatch(/suite-summary\.csv: missing column/);
  });
});
