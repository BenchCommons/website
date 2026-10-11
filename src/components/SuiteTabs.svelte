<script>
  import { int } from '../lib/format.js';

  let { suites, round, suite, cell, onsuite, oncell } = $props();
  let buttons = $state([]);

  function key(e, i) {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + suites.length) % suites.length;
    onsuite(suites[j]);
    buttons[j]?.focus();
  }
</script>

<div class="tabs" role="tablist" aria-label="Suite">
  {#each suites as s, i (s)}
    <button
      bind:this={buttons[i]}
      type="button"
      role="tab"
      aria-selected={s === suite}
      tabindex={s === suite ? 0 : -1}
      onclick={() => onsuite(s)}
      onkeydown={(e) => key(e, i)}
    >
      <span class="t">{s}</span>
      <span class="s">{int(round.suites[s].pages)} pages</span>
    </button>
  {/each}
</div>

<div class="sizes" role="group" aria-label="Post size">
  {#each round.suites[suite]?.cells ?? [] as c (c.id)}
    <button class="btn" type="button" aria-pressed={c.id === cell} onclick={() => oncell(c.id)}>{c.contentSize} KB posts</button>
  {/each}
</div>

<style>
  .tabs { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
  [role='tab'] { appearance: none; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); border-radius: 9px;
    padding: 10px 12px; cursor: pointer; display: grid; gap: 3px; text-align: left; font: inherit; }
  [role='tab'][aria-selected='true'] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .t { font-weight: 800; font-size: 19px; line-height: 1; }
  .s { font: 12px/1.2 var(--f-data); color: var(--ink-3); }
  .sizes { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
