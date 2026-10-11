import { describe, expect, it } from 'vitest';
import { composite } from '../../src/lib/composite.js';

const ok = (framework, rank, median) => ({ framework, rank, median });
const round = {
  generators: { a: {}, b: {}, c: {} },
  suites: {
    P: { cells: [
      { id: 'p5', ok: [ok('a', 1, 1), ok('b', 2, 2), ok('c', 3, 3)], failed: [] },
      { id: 'p50', ok: [ok('b', 1, 1), ok('a', 2, 2)], failed: [{ framework: 'c', kind: 'oom' }] },
    ] },
    GG: { cells: [
      { id: 'g5', ok: [], failed: [{ framework: 'a', kind: 'timeout' }, { framework: 'b', kind: 'heap' }, { framework: 'c', kind: 'missing' }] },
    ] },
  },
};

describe('composite', () => {
  const { columns, rows } = composite(round, ['P', 'GG']);

  it('has one column per cell in suite order', () => {
    expect(columns).toEqual([
      { key: 'P/p5', suite: 'P', cell: 'p5', okCount: 3 },
      { key: 'P/p50', suite: 'P', cell: 'p50', okCount: 2 },
      { key: 'GG/g5', suite: 'GG', cell: 'g5', okCount: 0 },
    ]);
  });

  it('orders by cells completed, then by the geometric mean of rank percentiles', () => {
    // a: sqrt(1/3 * 2/2) = 0.577; b: sqrt(2/3 * 1/2) = 0.577 → tie broken by id; c: 1 cell.
    expect(rows.map((r) => [r.framework, r.completed])).toEqual([['a', 2], ['b', 2], ['c', 1]]);
    expect(rows[0].score).toBeCloseTo(Math.sqrt(1 / 3), 6);
  });

  it('records rank and median or the failure kind per cell', () => {
    expect(rows[2].cells).toEqual({ 'P/p5': { rank: 3, median: 3 }, 'P/p50': { kind: 'oom' }, 'GG/g5': { kind: 'missing' } });
  });

  it('gives a null score to a generator with no completed cell', () => {
    const r = composite({ generators: { z: {} }, suites: { P: { cells: [{ id: 'x', ok: [], failed: [{ framework: 'z', kind: 'oom' }] }] } } }, ['P']);
    expect(r.rows).toEqual([{ framework: 'z', cells: { 'P/x': { kind: 'oom' } }, completed: 0, score: null }]);
  });
});
