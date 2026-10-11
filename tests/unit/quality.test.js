import { describe, expect, it } from 'vitest';
import { readJson } from '../../scripts/lib/csv.mjs';
import { qualityRows } from '../../scripts/lib/quality.mjs';

const results = readJson('tests/fixtures/bt/docs/results/2030-01-01/P/nf50-cs5/results.json');

describe('qualityRows', () => {
  const rows = qualityRows(results);

  it('sorts rows by framework', () => {
    expect(rows.map((r) => r.framework)).toEqual(['a', 'b']);
  });

  it('maps scores and post page counts', () => {
    expect(rows[0]).toMatchObject({
      framework: 'a', status: 'ok', postSource: 'index', error: null,
      mobile: { performance: 0.95, accessibility: 0.9, bestPractices: 0.8, seo: 0.7, lcpMs: 1200 },
      desktop: { performance: 1, lcpMs: 300 },
      postJsBytes: 0, jsClass: 'none', gzipBytes: 1000, htmlErrors: 3, axeViolations: 2,
      seoPresent: 4, seoTotal: 12,
    });
  });

  it('gives null for the fields of a section with status error', () => {
    expect(rows[0].brokenLinks).toBeNull();
  });

  it('keeps only framework, status and error for a failed pass', () => {
    expect(rows[1]).toEqual({ framework: 'b', status: 'error', error: 'boom' });
  });

  it('returns [] without a quality section', () => {
    expect(qualityRows({})).toEqual([]);
  });
});
