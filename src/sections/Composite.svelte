<script>
  import { composite } from '../lib/composite.js';
  import { applyFilters } from '../lib/filters.js';
  import { seconds } from '../lib/format.js';
  import { KIND_LABEL } from '../lib/kinds.js';

  let { round, suites, filters } = $props();

  const data = $derived(composite(round, suites));
  const visible = $derived.by(() => {
    const keep = new Set(applyFilters(data.rows, round.generators, { ...filters, status: [] }).map((r) => r.framework));
    return data.rows.filter((r) => keep.has(r.framework));
  });
  const size = (key) => round.suites[key.split('/')[0]].cells.find((c) => c.id === key.split('/')[1]).contentSize;
</script>

<p class="muted note">
  Rank and median of each generator in every cell of the round. Rows are ordered by the number of cells completed, then
  by how high they rank in those cells. There is no combined score: a generator that is fast on small sites and fails on
  large ones is shown as exactly that.
</p>

<div class="table-wrap">
  <table>
    <caption class="visually-hidden">Composite of round {round.id}</caption>
    <thead>
      <tr>
        <th class="l" scope="col">Generator</th>
        <th scope="col">Cells</th>
        {#each data.columns as c (c.key)}
          <th scope="col">{c.suite} · {size(c.key)} KB<br /><span class="sub">{c.okCount} ok</span></th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each visible as r (r.framework)}
        <tr>
          <td class="l">{round.generators[r.framework]?.name ?? r.framework}</td>
          <td>{r.completed}/{data.columns.length}</td>
          {#each data.columns as c (c.key)}
            {@const v = r.cells[c.key]}
            <td>
              {#if v.rank}
                <span class="rank">#{v.rank}</span> <span class="sub">{seconds(v.median)}</span>
              {:else}
                <span class="kind kind-{v.kind}">{KIND_LABEL[v.kind] ?? v.kind}</span>
              {/if}
            </td>
          {/each}
        </tr>
      {:else}
        <tr><td class="l empty" colspan={data.columns.length + 2}>No generator matches the filters.</td></tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .note { font-size: 13px; max-width: 80ch; }
  .rank { font-weight: 700; color: var(--ink); }
  .sub { color: var(--ink-3); font-size: 11px; font-weight: 400; }
</style>
