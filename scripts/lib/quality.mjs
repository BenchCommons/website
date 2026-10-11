const ok = (section) => section && section.status === 'ok';
const median = (m) => (m && typeof m.median === 'number' ? m.median : null);

function preset(lighthouse, name) {
  const post = ok(lighthouse) ? lighthouse[name]?.post : null;
  const s = ok(post) ? post.scores : null;
  return {
    performance: s ? median(s.performance) : null,
    accessibility: s ? median(s.accessibility) : null,
    bestPractices: s ? median(s['best-practices']) : null,
    seo: s ? median(s.seo) : null,
    lcpMs: ok(post) ? median(post.metrics?.lcp) : null,
  };
}

function row(framework, q) {
  if (q.status !== 'ok') return { framework, status: q.status, error: q.error ?? null };
  const post = (section, key) => (ok(section) ? section.pages?.post?.[key] ?? null : null);
  return {
    framework,
    status: 'ok',
    error: null,
    postSource: q.postSource ?? null,
    mobile: preset(q.lighthouse, 'mobile'),
    desktop: preset(q.lighthouse, 'desktop'),
    postJsBytes: ok(q.js) ? q.js.pages?.post ?? null : null,
    jsClass: ok(q.js) ? q.js.jsClass ?? null : null,
    gzipBytes: ok(q.weight) ? q.weight.gzipBytes ?? null : null,
    htmlErrors: post(q.html, 'errors'),
    axeViolations: post(q.a11y, 'total'),
    brokenLinks: ok(q.links) ? q.links.broken ?? null : null,
    seoPresent: post(q.seo, 'present'),
    seoTotal: ok(q.seo) ? q.seo.total ?? null : null,
  };
}

/** One row per generator from results.json `quality` (spec R-6), sorted by framework. */
export function qualityRows(results) {
  const q = results.quality || {};
  return Object.keys(q).sort().map((fw) => row(fw, q[fw]));
}
