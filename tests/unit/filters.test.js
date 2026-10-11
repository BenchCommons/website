import { describe, expect, it } from 'vitest';
import { applyFilters, facets } from '../../src/lib/filters.js';

const generators = {
  a: { language: 'Go', runtime: 'Compiled', category: 'general' },
  b: { language: 'Rust', runtime: 'Compiled', category: 'docs' },
  c: { language: 'Go', runtime: 'Compiled', category: 'blog' },
  d: { language: 'TypeScript', runtime: 'Node.js', category: 'framework' },
};
const rows = [
  { framework: 'b', rank: 1 }, { framework: 'a', rank: 2 }, { framework: 'c', rank: 3 },
  { framework: 'd', kind: 'oom' },
];
const none = { lang: [], runtime: [], category: [], status: [] };

describe('facets', () => {
  it('lists the sorted distinct values of every group', () => {
    expect(facets(rows, generators)).toEqual({
      lang: ['Go', 'Rust', 'TypeScript'], runtime: ['Compiled', 'Node.js'],
      category: ['blog', 'docs', 'framework', 'general'], status: ['ok', 'oom'],
    });
  });
});

describe('applyFilters', () => {
  it('keeps everything when no group has a selection', () => {
    expect(applyFilters(rows, generators, none)).toEqual(rows);
  });

  it('keeps the original ranks of the visible rows', () => {
    const go = applyFilters(rows, generators, { ...none, lang: ['Go'] });
    expect(go.map((r) => [r.framework, r.rank])).toEqual([['a', 2], ['c', 3]]);
  });

  it('combines groups with AND and values with OR', () => {
    expect(applyFilters(rows, generators, { ...none, runtime: ['Compiled', 'Node.js'], status: ['oom'] }))
      .toEqual([{ framework: 'd', kind: 'oom' }]);
  });

  it('treats a generator without metadata as unknown', () => {
    expect(applyFilters([{ framework: 'x', rank: 1 }], generators, { ...none, lang: ['unknown'] })).toHaveLength(1);
  });
});
