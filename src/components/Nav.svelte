<script>
  import { encode } from '../lib/hash.js';
  import ThemeToggle from './ThemeToggle.svelte';

  let { index, ui, round, onround } = $props();

  const ITEMS = [
    ['intro', 'Introduction'],
    ['results', 'Results'],
    ['quality', 'Quality'],
    ['environment', 'Environment'],
    ['rounds', 'Previous rounds'],
  ];
</script>

<header class="top">
  <div class="bar">
    <a class="brand" href={encode({ ...ui, section: 'intro' }, round)}>Bench<span>Commons</span></a>
    <label class="round">
      <span class="visually-hidden">Round</span>
      <select value={ui.round} onchange={(e) => onround(e.currentTarget.value)}>
        {#each index.rounds as r (r.id)}
          <option value={r.id}>Round {r.id}</option>
        {/each}
      </select>
    </label>
    <ThemeToggle />
  </div>
  <nav aria-label="Sections">
    {#each ITEMS as [id, label] (id)}
      <a href={encode({ ...ui, section: id }, round)} aria-current={ui.section === id ? 'page' : undefined}>{label}</a>
    {/each}
  </nav>
</header>

<style>
  .top { background: var(--surface); border-bottom: 1px solid var(--rule); }
  .bar, nav { max-width: 1120px; margin: 0 auto; padding: 0 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .bar { padding-block: 12px 6px; }
  .brand { font-weight: 800; font-size: 19px; color: var(--ink); text-decoration: none; margin-right: auto; letter-spacing: -.01em; }
  .brand span { color: var(--accent); }
  select { font: inherit; font-size: 13px; padding: 6px 8px; border-radius: 7px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); }
  nav { gap: 2px; overflow-x: auto; scrollbar-width: none; }
  nav a { color: var(--ink-2); text-decoration: none; padding: 10px 10px 9px; border-bottom: 2px solid transparent; white-space: nowrap; font-size: 14px; }
  nav a[aria-current="page"] { color: var(--ink); border-bottom-color: var(--accent); font-weight: 600; }
  nav a:hover { color: var(--ink); }
</style>
