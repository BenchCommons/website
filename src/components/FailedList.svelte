<script>
  import { KIND_HELP, KIND_LABEL } from '../lib/kinds.js';

  let { rows, generators } = $props();

  const groups = $derived.by(() => {
    const m = new Map();
    for (const r of rows) m.set(r.kind, [...(m.get(r.kind) ?? []), r]);
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  });
</script>

{#if rows.length}
  <div class="failed">
    <h3>Did not complete ({rows.length})</h3>
    {#each groups as [kind, list] (kind)}
      <div class="group">
        <span class="kind kind-{kind}" title={KIND_HELP[kind]}>{KIND_LABEL[kind] ?? kind}</span>
        <ul>
          {#each list as r (r.framework)}
            <li>
              {#if r.reason}
                <button type="button" class="item" title={r.reason} data-reason={r.reason}>{generators[r.framework]?.name ?? r.framework}</button>
              {:else}
                <span class="item">{generators[r.framework]?.name ?? r.framework}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
{/if}

<style>
  .failed { display: grid; gap: 8px; }
  .group { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .item { font: inherit; font-size: 13px; background: var(--chip); color: var(--ink); border: 0; border-radius: 999px; padding: 3px 9px; position: relative; }
  button.item { cursor: help; text-decoration: underline dotted var(--ink-3); }
  button.item:focus::after, button.item:hover::after {
    content: attr(data-reason); position: absolute; left: 0; top: calc(100% + 4px); z-index: 3; width: max-content; max-width: min(80vw, 420px);
    white-space: normal; text-align: left; background: var(--ink); color: var(--bg); font: 12px/1.4 var(--f-data); padding: 6px 8px; border-radius: 6px;
  }
</style>
