<script>
  import DataTable from '../components/DataTable.svelte';
  import FilterPanel from '../components/FilterPanel.svelte';
  import { applyFilters, facets } from '../lib/filters.js';
  import { bytes, int } from '../lib/format.js';

  let { round, ui, set } = $props();

  let preset = $state('mobile');
  const g = $derived(round.generators);
  const groups = $derived({ ...ui.filters, status: [] });
  const rows = $derived(applyFilters(round.quality, g, groups));

  const score = (v) => (v === null || v === undefined ? '—' : Math.round(v * 100));
  const cls = (v) => (v === null || v === undefined ? '' : v >= 0.9 ? 'good' : v >= 0.5 ? 'avg' : 'poor');
  const pick = (r, k) => r[preset]?.[k] ?? null;
  const scoreCol = (key, label) => ({
    key, label, value: (r) => pick(r, key),
    format: (v) => (v === null ? '—' : `<span class="score score-${cls(v)}">${score(v)}</span>`), html: true,
  });

  const columns = $derived([
    { key: 'name', label: 'Generator', left: true, value: (r) => g[r.framework]?.name ?? r.framework },
    { ...scoreCol('performance', 'Perf') },
    { ...scoreCol('accessibility', 'A11y') },
    { ...scoreCol('bestPractices', 'Best pr.') },
    { ...scoreCol('seo', 'SEO') },
    { key: 'lcp', label: 'LCP', value: (r) => pick(r, 'lcpMs'), format: (v) => (v === null ? '—' : `${int(v)} ms`) },
    { key: 'js', label: 'Post JS', value: (r) => r.postJsBytes, format: bytes },
    { key: 'jsClass', label: 'JS', left: true, value: (r) => r.jsClass },
    { key: 'gzip', label: 'Site gzip', value: (r) => r.gzipBytes, format: bytes },
    { key: 'html', label: 'HTML errors', value: (r) => r.htmlErrors, format: int },
    { key: 'axe', label: 'Axe', value: (r) => r.axeViolations, format: int },
    { key: 'links', label: 'Broken links', value: (r) => r.brokenLinks, format: int },
    { key: 'seoN', label: 'SEO signals', value: (r) => r.seoPresent, format: (v, r) => (v === null ? '—' : `${v}/${r.seoTotal}`) },
    { key: 'src', label: 'Post page', left: true, value: (r) => r.postSource },
  ]);
</script>

<section aria-labelledby="q-h">
  <div class="head">
    <h1 id="q-h">Output quality, round {round.id}</h1>
    <p class="lede">
      An untimed audit of what each generator wrote in suite P (50 pages, 5 KB posts): Lighthouse scores of a post page
      (median of 3 runs), JavaScript shipped, page weight, HTML validity, accessibility violations, broken links and SEO
      signals.
    </p>
  </div>

  {#if !round.quality.length}
    <p class="card empty">This round has no quality audit. It started with round 2026-10-11.</p>
  {:else}
    <div class="layout">
      <FilterPanel
        facets={facets(round.quality, g)}
        filters={ui.filters}
        onchange={(filters) => set({ filters })}
        visible={rows.length}
        total={round.quality.length}
        hide={['status']}
      />
      <div class="card">
        <div class="seg" role="group" aria-label="Lighthouse preset">
          <button class="btn" type="button" aria-pressed={preset === 'mobile'} onclick={() => (preset = 'mobile')}>Mobile</button>
          <button class="btn" type="button" aria-pressed={preset === 'desktop'} onclick={() => (preset = 'desktop')}>Desktop</button>
        </div>
        <DataTable
          {columns}
          {rows}
          sort={{ key: 'name', dir: 1 }}
          caption="Output quality, {preset}"
          fullRow={(r) => (r.status === 'ok' ? null : `Audit failed: ${r.error ?? r.status}`)}
        />
        <div class="notes muted">
          <p>
            <b>Read the SEO columns with care.</b> The reference templates carry no meta description and no viewport, so
            every generator that renders them loses the same SEO points. That part of the score is the same for all of
            them and isn't a difference between generators.
          </p>
          <p>
            <b>Post page</b> says how the audited post was chosen: <code>index</code> means the first post linked from
            the reference index layout; <code>glob</code> means the generator doesn't render that layout yet, so the
            first output file matching its post pattern was audited, with the generator's own theme.
          </p>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  section { display: grid; gap: 16px; min-width: 0; }
  .head { display: grid; gap: 8px; }
  .layout { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start; }
  @media (min-width: 960px) { .layout { grid-template-columns: 240px minmax(0, 1fr); } }
  .notes { display: grid; gap: 8px; font-size: 13px; max-width: 80ch; }
  .notes b { color: var(--ink); }
</style>
