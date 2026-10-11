import { describe, expect, it } from 'vitest';
import { compare } from '../../src/lib/compare.js';

describe('compare', () => {
  it('pairs shared generators with their ratio and lists the rest apart', () => {
    const a = { ok: [{ framework: 'x', median: 2 }, { framework: 'y', median: 1 }, { framework: 'only-a', median: 1 }] };
    const b = { ok: [{ framework: 'y', median: 1.5 }, { framework: 'x', median: 1 }, { framework: 'only-b', median: 3 }] };
    expect(compare(a, b)).toEqual({
      both: [{ framework: 'x', a: 2, b: 1, ratio: 0.5 }, { framework: 'y', a: 1, b: 1.5, ratio: 1.5 }],
      onlyA: ['only-a'],
      onlyB: ['only-b'],
    });
  });

  it('handles a missing cell on either side', () => {
    expect(compare(null, { ok: [{ framework: 'x', median: 1 }] })).toEqual({ both: [], onlyA: [], onlyB: ['x'] });
  });
});
