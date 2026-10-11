import { describe, expect, it } from 'vitest';
import { loadMeta, metaFor } from '../../scripts/lib/meta.mjs';

const meta = loadMeta('tests/fixtures/sf');

describe('metaFor', () => {
  it('keeps the first word of runtime as the family', () => {
    expect(metaFor(meta, 'a')).toEqual({
      name: 'Alpha', language: 'TypeScript', runtime: 'Node.js', category: 'framework',
      homepage: 'https://a.example', repository: 'https://github.com/x/a', license: 'MIT', version: '1.0.0',
    });
    expect(metaFor(meta, 'b').runtime).toBe('JVM');
  });

  it('falls back to the id and unknown for a generator missing from generators.json', () => {
    expect(metaFor(meta, 'zzz')).toEqual({
      name: 'zzz', language: 'unknown', runtime: 'unknown', category: 'unknown',
      homepage: null, repository: null, license: null, version: null,
    });
  });
});
