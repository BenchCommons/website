import { describe, expect, it } from 'vitest';
import { decode, encode } from '../../src/lib/hash.js';

const index = { rounds: [
  { id: '2026-10-11', suites: ['P', 'M', 'G', 'GG'] },
  { id: '2026-10-06', suites: ['P', 'M'] },
] };
const round = { id: '2026-10-11', suites: {
  P: { cells: [{ id: 'nf50-cs5' }, { id: 'nf50-cs50' }] },
  G: { cells: [{ id: 'nf10000-cs5' }, { id: 'nf10000-cs50' }] },
} };
const empty = { lang: [], runtime: [], category: [], status: [] };

describe('decode', () => {
  it('falls back to the defaults for an empty hash', () => {
    expect(decode('', index, round)).toEqual({
      section: 'results', round: '2026-10-11', suite: 'P', cell: 'nf50-cs5', view: 'chart', compare: null, filters: empty,
    });
  });

  it('reads every key', () => {
    const s = decode('#section=quality&round=2026-10-11&suite=G&cell=nf10000-cs50&view=table&lang=Rust,Go&status=ok', index, round);
    expect(s).toEqual({
      section: 'quality', round: '2026-10-11', suite: 'G', cell: 'nf10000-cs50', view: 'table', compare: null,
      filters: { ...empty, lang: ['Go', 'Rust'], status: ['ok'] },
    });
  });

  it('falls back per key for unknown values', () => {
    const s = decode('#section=nope&round=1999-01-01&suite=XL&cell=nf1-cs1&view=pie', index, round);
    expect(s).toMatchObject({ section: 'results', round: '2026-10-11', suite: 'P', cell: 'nf50-cs5', view: 'chart' });
  });

  it('keeps a valid suite whose round is not loaded yet and leaves the cell unresolved', () => {
    const s = decode('#round=2026-10-06&suite=M&cell=nf1000-cs50', index, null);
    expect(s).toMatchObject({ round: '2026-10-06', suite: 'M', cell: 'nf1000-cs50' });
  });

  it('drops a suite the round does not have', () => {
    expect(decode('#round=2026-10-06&suite=GG', index, null).suite).toBe('P');
  });

  it('accepts a compare round other than the shown one', () => {
    expect(decode('#compare=2026-10-06', index, round).compare).toBe('2026-10-06');
    expect(decode('#compare=2026-10-11', index, round).compare).toBeNull();
    expect(decode('#compare=1999-01-01', index, round).compare).toBeNull();
  });
});

describe('encode', () => {
  it('omits defaults but always writes the round', () => {
    expect(encode(decode('', index, round), round)).toBe('#round=2026-10-11');
  });

  it('round-trips every key, with filter values sorted and encoded', () => {
    const h = '#section=results&round=2026-10-11&suite=G&cell=nf10000-cs50&view=table&compare=2026-10-06&lang=Rust,Go&runtime=Node.js,.NET,Erlang%2FOTP';
    const once = encode(decode(h, index, round), round);
    expect(once).toBe('#round=2026-10-11&suite=G&cell=nf10000-cs50&view=table&compare=2026-10-06&lang=Go,Rust&runtime=.NET,Erlang%2FOTP,Node.js');
    expect(encode(decode(once, index, round), round)).toBe(once);
    expect(decode(once, index, round).filters.runtime).toEqual(['.NET', 'Erlang/OTP', 'Node.js']);
  });
});
