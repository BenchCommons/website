import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BuildError } from '../../scripts/lib/csv.mjs';
import { loadMeta } from '../../scripts/lib/meta.mjs';
import { buildRound, listRounds, roundIndexEntry } from '../../scripts/lib/round.mjs';

const BT = 'tests/fixtures/bt';
const DIR = `${BT}/docs/results/2030-01-01`;
const meta = loadMeta('tests/fixtures/sf');
const round = buildRound(DIR, meta);
const cell = (suite, id) => round.suites[suite].cells.find((c) => c.id === id);

describe('listRounds', () => {
  it('returns only dated directories, newest first', () => {
    expect(listRounds(BT)).toEqual(['2030-01-01']);
  });
});

describe('buildRound', () => {
  it('ranks ok rows by median', () => {
    expect(cell('P', 'nf50-cs5').ok.map((r) => [r.framework, r.rank])).toEqual([['b', 1], ['a', 2]]);
  });

  it('keeps numbers as numbers and an empty CV as null', () => {
    expect(cell('P', 'nf50-cs5').ok[0]).toEqual({
      framework: 'b', rank: 1, median: 0.5, cv: null, min: 0.4, max: 0.6, postsPerSecond: 100,
      peakRssMB: 40, outputFiles: 54, runs: 5, fingerprint: 'fp2',
    });
  });

  it('classifies failures and adds missing generators', () => {
    expect(cell('P', 'nf50-cs5').failed).toEqual([{ framework: 'c', kind: 'oom', reason: null }]);
    expect(cell('P', 'nf50-cs50').failed).toEqual([
      { framework: 'b', kind: 'heap', reason: 'build exited 134' },
      { framework: 'c', kind: 'missing', reason: null },
    ]);
  });

  it('handles a cell where every generator failed', () => {
    const m = cell('M', 'nf1000-cs5');
    expect(m.ok).toEqual([]);
    expect(m.failed.map((f) => f.kind)).toEqual(['timeout', 'error', 'missing']);
    expect(round.suites.M.pages).toBe(1000);
  });

  it('joins metadata with the fallback for unknown generators', () => {
    expect(round.generators.a.name).toBe('Alpha');
    expect(round.generators.c).toMatchObject({ name: 'c', language: 'unknown' });
  });

  it('builds the environment with fingerprints and cpu models', () => {
    expect(round.environment).toEqual({
      runner: 'GitHub Actions ubuntu-24.04, one runner per generator', cpus: 4, memoryBytes: 8589934592,
      swap: false, profile: 'core', toolset: 'abc1234', docker: '28.0.4',
      quality: { lighthouse: '13.5.0', chromium: '156.0' },
      fingerprints: [
        { id: 'fp1', cpuModel: 'AMD EPYC 7763 64-Core Processor', generators: 1 },
        { id: 'fp2', cpuModel: 'Fallback CPU', generators: 1 },
      ],
    });
  });

  it('collects quality rows from the cell that has them', () => {
    expect(round.quality.map((q) => q.framework)).toEqual(['a', 'b']);
  });

  it('throws a BuildError naming a CSV without median', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'round-'));
    cpSync(DIR, tmp, { recursive: true });
    writeFileSync(join(tmp, 'P/suite-summary.csv'), 'cell,framework\nnf50-cs5,a\n');
    expect(() => buildRound(tmp, meta)).toThrow(BuildError);
    expect(() => buildRound(tmp, meta)).toThrow(/P\/suite-summary\.csv: missing column/);
  });
});

describe('roundIndexEntry', () => {
  it('summarises the round and reads run ids from the README', () => {
    expect(roundIndexEntry(round, `${DIR}/README.md`)).toEqual({
      id: '2030-01-01', suites: ['P', 'M'], generators: 3, runs: { P: '111', M: '222' }, hasQuality: true,
    });
  });
});
