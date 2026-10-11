<script>
  import Composite from './Composite.svelte';
  import BarChart from '../components/BarChart.svelte';
  import DataTable from '../components/DataTable.svelte';
  import FailedList from '../components/FailedList.svelte';
  import FilterPanel from '../components/FilterPanel.svelte';
  import SuiteTabs from '../components/SuiteTabs.svelte';
  import { applyFilters, facets } from '../lib/filters.js';
  import { int, percent, seconds } from '../lib/format.js';

  let { round, ui, suites, set } = $props();

  const composite = $derived(ui.view === 'composite');
  const everyone = $derived(Object.keys(round.generators).map((framework) => ({ framework })));

  let scale = $state('log');

  const cell = $derived(round.suites[ui.suite]?.cells.find((c) => c.id === ui.cell));
  const all = $derived(cell ? [...cell.ok, ...cell.failed] : []);
  const shown = $derived(applyFilters(all, round.generators, ui.filters));
  const ok = $derived(shown.filter((r) => r.kind === undefined));
  const failed = $derived(shown.filter((r) => r.kind !== undefined));
  const g = $derived(round.generators);

  const COLUMNS = [
    { key: 'rank', label: 'Rank', value: (r) => r.rank },
    { key: 'name', label: 'Generator', left: true, value: (r) => g[r.framework]?.name ?? r.framework },
    { key: 'language', label: 'Language', left: true, value: (r) => g[r.framework]?.language },
    { key: 'median', label: 'Median', value: (r) => r.median, format: seconds },
    { key: 'cv', label: 'CV', value: (r) => r.cv, format: percent },
    { key: 'min', label: 'Min', value: (r) => r.min, format: seconds },
    { key: 'max', label: 'Max', value: (r) => r.max, format: seconds },
    { key: 'pps', label: 'Posts/s', value: (r) => r.postsPerSecond, format: int },
    { key: 'rss', label: 'Peak RSS (MB)', value: (r) => r.peakRssMB, format: int },
    { key: 'files', label: 'Files', value: (r) => r.outputFiles, format: int },
    { key: 'runs', label: 'Runs', value: (r) => r.runs },
    { key: 'fp', label: 'Fingerprint', left: true, value: (r) => r.fingerprint },
  ];
</script>

<section aria-labelledby="res-h">
  <div class="head">
    <h1 id="res-h">Results, round {round.id}</h1>
    <p class="lede">
      Median wall time of a cold build of the reference site. Lower is faster. Ranks are computed over every generator
      that completed the cell, before any filter.
    </p>
  </div>

  <SuiteTabs
    {suites}
    {round}
    suite={ui.suite}
    cell={ui.cell}
    onsuite={(s) => set({ suite: s, cell: null })}
    oncell={(c) => set({ cell: c })}
  />

  <div class="layout">
    <FilterPanel
      facets={facets(composite ? everyone : all, g)}
      filters={ui.filters}
      onchange={(filters) => set({ filters })}
      visible={composite ? applyFilters(everyone, g, { ...ui.filters, status: [] }).length : shown.length}
      total={composite ? Object.keys(g).length : all.length}
      hide={composite ? ['status'] : []}
    />

    <div class="card body">
      <div class="controls">
        <div class="seg" role="group" aria-label="View">
          {#each [['chart', 'Chart'], ['table', 'Data table'], ['composite', 'Composite']] as [v, label] (v)}
            <button class="btn" type="button" aria-pressed={ui.view === v} onclick={() => set({ view: v })}>{label}</button>
          {/each}
        </div>
        {#if ui.view === 'chart'}
          <div class="seg" role="group" aria-label="Scale">
            <button class="btn" type="button" aria-pressed={scale === 'log'} onclick={() => (scale = 'log')}>Log scale</button>
            <button class="btn" type="button" aria-pressed={scale === 'linear'} onclick={() => (scale = 'linear')}>Linear</button>
          </div>
        {/if}
      </div>

      {#if ui.view === 'composite'}
        <Composite {round} {suites} filters={ui.filters} />
      {:else if cell}
        <p class="muted cellinfo">
          {int(cell.numberOfFiles)} pages × {cell.contentSize} KB · {cell.ok.length} of {all.length} completed
        </p>
        {#if ui.view === 'chart'}
          <BarChart rows={ok} generators={g} {scale} />
        {:else}
          <DataTable columns={COLUMNS} rows={ok} sort={{ key: 'rank', dir: 1 }} caption="Results for {ui.suite} {cell.contentSize} KB" />
        {/if}
        <FailedList rows={failed} generators={g} />
      {/if}
    </div>
  </div>
</section>

<style>
  section { display: grid; gap: 16px; min-width: 0; }
  .head { display: grid; gap: 8px; }
  .layout { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start; }
  @media (min-width: 960px) { .layout { grid-template-columns: 240px minmax(0, 1fr); } }
  .body { gap: 14px; }
  .controls { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; }
  .cellinfo { font-size: 13px; }
</style>
