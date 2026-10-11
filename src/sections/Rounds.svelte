<script>
  import DataTable from '../components/DataTable.svelte';
  import SuiteTabs from '../components/SuiteTabs.svelte';
  import { compare } from '../lib/compare.js';
  import { loadRound } from '../lib/data.js';
  import { encode } from '../lib/hash.js';
  import { seconds } from '../lib/format.js';

  let { index, round, ui, set } = $props();

  let other = $state(null);
  let error = $state(null);

  $effect(() => {
    const id = ui.compare;
    other = null;
    error = null;
    if (id) loadRound(id).then((r) => ui.compare === id && (other = r)).catch((e) => (error = e.message));
  });

  const shared = $derived(other ? index.rounds.find((r) => r.id === ui.round).suites.filter((s) => other.suites[s]) : []);
  const suite = $derived(shared.includes(ui.suite) ? ui.suite : shared[0]);
  const cellA = $derived(round.suites[suite]?.cells.find((c) => c.id === ui.cell) ?? round.suites[suite]?.cells[0]);
  const cellB = $derived(other?.suites[suite]?.cells.find((c) => c.id === cellA?.id));
  const result = $derived(other && cellA ? compare(cellA, cellB) : null);
  const name = (fw) => round.generators[fw]?.name ?? other?.generators[fw]?.name ?? fw;

  const columns = $derived([
    { key: 'name', label: 'Generator', left: true, value: (r) => name(r.framework) },
    { key: 'a', label: `${ui.round}`, value: (r) => r.a, format: seconds },
    { key: 'b', label: `${ui.compare}`, value: (r) => r.b, format: seconds },
    { key: 'ratio', label: 'Ratio', value: (r) => r.ratio, format: (v) => `×${v.toFixed(2)}` },
  ]);
</script>

<section aria-labelledby="r-h">
  <div class="head">
    <h1 id="r-h">Previous rounds</h1>
    <p class="lede">Every round published in the benchmark-tool repository, newest first.</p>
  </div>

  <ol class="list" data-testid="round-list">
    {#each index.rounds as r (r.id)}
      <li class="card">
        <div class="row">
          <a class="id" href={encode({ ...ui, section: 'results', round: r.id, suite: null, cell: null, compare: null }, null)}>Round {r.id}</a>
          {#if r.id === ui.round}<span class="chip">shown</span>{/if}
        </div>
        <p class="muted">{r.generators} generators · suites {r.suites.join(', ')}{r.hasQuality ? ' · quality audit' : ''}</p>
        {#if Object.keys(r.runs).length}
          <p class="runs">
            Workflow runs:
            {#each r.suites.filter((s) => r.runs[s]) as s (s)}
              <a href="https://github.com/BenchCommons/benchmark-tool/actions/runs/{r.runs[s]}">{s}</a>{' '}
            {/each}
          </p>
        {/if}
      </li>
    {/each}
  </ol>

  <div class="card compare">
    <h2>Compare two rounds</h2>
    <label>
      Compare round {ui.round} with
      <select value={ui.compare ?? ''} onchange={(e) => set({ compare: e.currentTarget.value || null })}>
        <option value="">choose a round</option>
        {#each index.rounds.filter((r) => r.id !== ui.round) as r (r.id)}
          <option value={r.id}>{r.id}</option>
        {/each}
      </select>
    </label>

    {#if error}
      <p role="alert">Could not load round {ui.compare}: {error}</p>
    {:else if ui.compare && !other}
      <p class="muted">Loading round {ui.compare}…</p>
    {:else if other && !shared.length}
      <p class="muted">The two rounds have no suite in common.</p>
    {:else if result}
      <SuiteTabs suites={shared} {round} {suite} cell={cellA.id} onsuite={(s) => set({ suite: s, cell: null })} oncell={(c) => set({ cell: c })} />
      <p class="muted">
        Median of each generator in both rounds. The ratio is {ui.compare} divided by {ui.round}: below ×1 means it was
        faster in {ui.compare}. Runner hardware differs between rounds, so small ratios are noise.
      </p>
      <DataTable {columns} rows={result.both} sort={{ key: 'ratio', dir: 1 }} caption="Comparison of {ui.round} and {ui.compare}" />
      <div class="only">
        <p><b>Only in {ui.round}:</b> {result.onlyA.map(name).join(', ') || 'none'}</p>
        <p><b>Only in {ui.compare}:</b> {result.onlyB.map(name).join(', ') || 'none'}</p>
      </div>
    {/if}
  </div>
</section>

<style>
  section { display: grid; gap: 16px; min-width: 0; }
  .head { display: grid; gap: 8px; }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
  .list li { gap: 6px; }
  .row { display: flex; gap: 8px; align-items: center; }
  .id { font-weight: 700; font-size: 17px; }
  .runs { font-size: 13px; color: var(--ink-2); }
  .runs a { margin-left: 4px; }
  select { font: inherit; padding: 5px 8px; border-radius: 7px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); }
  .only { display: grid; gap: 6px; font-size: 13px; color: var(--ink-2); }
  .only b { color: var(--ink); }
</style>
