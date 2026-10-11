<script>
  // Filter groups (spec R-13). An empty selection means "all"; NONE selects nothing.
  import { KIND_LABEL } from '../lib/kinds.js';

  let { facets, filters, onchange, visible, total, hide = [] } = $props();

  const NONE = '-';
  const GROUPS = [
    ['lang', 'Language'],
    ['runtime', 'Runtime'],
    ['category', 'Category'],
    ['status', 'Status'],
  ];

  let open = $state(typeof matchMedia === 'undefined' || matchMedia('(min-width: 720px)').matches);

  const checked = (k, v) => !filters[k].length || filters[k].includes(v);

  function toggle(k, v) {
    const all = facets[k];
    let sel = filters[k].length ? filters[k].filter((x) => x !== NONE) : [...all];
    sel = sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v];
    if (all.every((x) => sel.includes(x))) sel = [];
    else if (!sel.length) sel = [NONE];
    onchange({ ...filters, [k]: sel });
  }

  const label = (k, v) => (k === 'status' ? KIND_LABEL[v] ?? v : v);
</script>

<details class="panel" bind:open>
  <summary>Filters <span class="count">{visible} of {total} generators</span></summary>
  <div class="groups">
    {#each GROUPS.filter(([k]) => !hide.includes(k)) as [k, title] (k)}
      <fieldset>
        <legend>{title}</legend>
        <div class="all">
          <button type="button" class="link" onclick={() => onchange({ ...filters, [k]: [] })}>Enable all</button>
          <button type="button" class="link" onclick={() => onchange({ ...filters, [k]: [NONE] })}>Disable all</button>
        </div>
        {#each facets[k] as v (v)}
          <label><input type="checkbox" checked={checked(k, v)} onchange={() => toggle(k, v)} /> {label(k, v)}</label>
        {/each}
      </fieldset>
    {/each}
  </div>
</details>

<style>
  .panel { background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; padding: 10px 14px; min-width: 0; }
  summary { cursor: pointer; font-weight: 600; display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .count { font: 500 12px/1.6 var(--f-data); color: var(--ink-3); }
  .groups { display: grid; gap: 14px; margin-top: 10px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
  fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 3px; align-content: start; min-width: 0; }
  legend { font-weight: 600; font-size: 13px; padding: 0; margin-bottom: 2px; }
  label { font-size: 13px; display: flex; gap: 6px; align-items: center; color: var(--ink-2); cursor: pointer; }
  .all { display: flex; gap: 10px; margin-bottom: 2px; }
  .link { appearance: none; border: 0; background: none; padding: 0; color: var(--accent); font: inherit; font-size: 12px; cursor: pointer; text-decoration: underline; }
</style>
