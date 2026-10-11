<script>
  import { percent, seconds } from '../lib/format.js';

  let { rows, generators, scale = 'log' } = $props();

  const hi = $derived(Math.max(...rows.map((r) => r.median), 0));
  const lo = $derived(Math.min(...rows.map((r) => r.median), Infinity));

  function width(m) {
    if (!(hi > 0)) return 0;
    if (scale === 'linear') return Math.max(0.5, (m / hi) * 100);
    const floor = lo / 2;
    const span = Math.log10(hi / floor);
    return span > 0 ? Math.max(2, (Math.log10(m / floor) / span) * 100) : 100;
  }
</script>

{#if rows.length}
  <ol class="chart" aria-label="Median build time, fastest first">
    {#each rows as r (r.framework)}
      <li>
        <span class="rank mono">{r.rank}</span>
        <span class="name">{generators[r.framework]?.name ?? r.framework} <span class="lang">{generators[r.framework]?.language ?? ''}</span></span>
        <span class="track"><span class="bar" style:width="{width(r.median)}%"></span></span>
        <span class="val mono">{seconds(r.median)}{#if r.cv !== null}<span class="cv">&nbsp;±{percent(r.cv)}</span>{/if}</span>
      </li>
    {/each}
  </ol>
{:else}
  <p class="empty">No completed build to show for this cell.</p>
{/if}

<style>
  .chart { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  li { display: grid; grid-template-columns: 2.2em minmax(7em, 13em) 1fr 8.5em; align-items: center; gap: 8px; padding: 3px 0; font-size: 13.5px; }
  .rank { color: var(--ink-3); text-align: right; font-size: 12px; }
  .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lang { color: var(--ink-3); font-size: 11.5px; }
  .track { height: 14px; background: var(--chip); border-radius: 3px; overflow: hidden; }
  .bar { display: block; height: 100%; background: var(--bar); border-radius: 3px; }
  li:hover .bar { background: var(--bar-hover); }
  .val { text-align: right; font-size: 12.5px; white-space: nowrap; }
  .cv { color: var(--ink-3); font-size: 11px; }
  @media (max-width: 560px) {
    li { grid-template-columns: 2em 1fr auto; row-gap: 2px; }
    .track { grid-column: 2 / 4; grid-row: 2; height: 10px; }
  }
</style>
