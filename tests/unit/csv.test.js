import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BuildError, readCsv } from '../../scripts/lib/csv.mjs';
import { stableStringify } from '../../scripts/lib/stable.mjs';

const dir = mkdtempSync(join(tmpdir(), 'csv-'));

describe('readCsv', () => {
  it('parses rows as objects', () => {
    const p = join(dir, 'ok.csv');
    writeFileSync(p, 'framework,median\nhugo,0.5\n');
    expect(readCsv(p, ['framework', 'median'])).toEqual([{ framework: 'hugo', median: '0.5' }]);
  });

  it('throws a BuildError naming the file and the missing column', () => {
    const p = join(dir, 'bad.csv');
    writeFileSync(p, 'framework\nhugo\n');
    expect(() => readCsv(p, ['framework', 'median'])).toThrow(BuildError);
    expect(() => readCsv(p, ['median'])).toThrow(`${p}: missing column median`);
  });

  it('throws a BuildError for an unreadable file', () => {
    expect(() => readCsv(join(dir, 'nope.csv'), [])).toThrow(BuildError);
  });
});

describe('stableStringify', () => {
  it('sorts keys recursively and ends with a newline', () => {
    const a = stableStringify({ b: 1, a: { d: [1, { y: 1, x: 2 }], c: null } });
    const b = stableStringify({ a: { c: null, d: [1, { x: 2, y: 1 }] }, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":{"c":null,"d":[1,{"x":2,"y":1}]},"b":1}\n');
  });
});
