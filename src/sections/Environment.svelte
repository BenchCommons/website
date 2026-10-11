<script>
  import { bytes, int } from '../lib/format.js';

  let { round, entry, suites } = $props();
  const env = $derived(round.environment);
  const yesNo = (v) => (v === null || v === undefined ? '—' : v ? 'on' : 'off');
</script>

<section aria-labelledby="env-h">
  <div class="head">
    <h1 id="env-h">Environment, round {round.id}</h1>
    <p class="lede">
      Each generator and cell ran on its own hosted runner. Runners don't all have the same CPU, so the medians on
      this site from different hardware fingerprints are shown side by side for reading. The official rankings in the
      benchmark-tool repository compare only generators that shared a fingerprint.
    </p>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Machine</h2>
      <dl>
        <dt>Runner</dt><dd>{env.runner ?? '—'}</dd>
        <dt>CPUs per container</dt><dd class="mono">{env.cpus ?? '—'}</dd>
        <dt>Memory limit</dt><dd class="mono">{bytes(env.memoryBytes)}</dd>
        <dt>Swap</dt><dd class="mono">{yesNo(env.swap)}</dd>
        <dt>Profile</dt><dd class="mono">{env.profile ?? '—'}</dd>
        <dt>Docker</dt><dd class="mono">{env.docker ?? '—'}</dd>
        <dt>Toolset commit</dt>
        <dd class="mono">
          {#if env.toolset}<a href="https://github.com/BenchCommons/benchmark-tool/commit/{env.toolset}">{env.toolset}</a>{:else}—{/if}
        </dd>
      </dl>
    </div>

    <div class="card">
      <h2>Protocol</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th class="l">Suite</th><th>Pages</th><th>Runs</th><th>Warm-up</th><th>Timeout</th><th>CV limit</th><th class="l">Workflow run</th></tr></thead>
          <tbody>
            {#each suites as s (s)}
              {@const p = round.suites[s].protocol}
              <tr>
                <td class="l">{s}</td>
                <td>{int(round.suites[s].pages)}</td>
                <td>{p?.runs ?? '—'}</td>
                <td>{p?.warmupBuilds ?? '—'}</td>
                <td>{p?.timeoutSeconds ? `${int(p.timeoutSeconds)} s` : '—'}</td>
                <td>{p?.cvThreshold ?? '—'}</td>
                <td class="l">
                  {#if entry?.runs?.[s]}<a href="https://github.com/BenchCommons/benchmark-tool/actions/runs/{entry.runs[s]}">{entry.runs[s]}</a>{:else}—{/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    {#if env.quality}
      <div class="card">
        <h2>Quality tools</h2>
        <dl>
          {#each Object.entries(env.quality).sort() as [tool, version] (tool)}
            <dt>{tool}</dt><dd class="mono">{version}</dd>
          {/each}
        </dl>
      </div>
    {/if}

    <div class="card">
      <h2>Hardware fingerprints</h2>
      <p class="muted">{env.fingerprints.length} distinct fingerprints in this round.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th class="l">Fingerprint</th><th class="l">CPU</th><th>Generators</th></tr></thead>
          <tbody>
            {#each env.fingerprints as f (f.id)}
              <tr><td class="l">{f.id}</td><td class="l">{f.cpuModel ?? '—'}</td><td>{f.generators}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<style>
  section { display: grid; gap: 20px; }
  .head { display: grid; gap: 8px; }
  .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; margin: 0; font-size: 14px; }
  dt { color: var(--ink-3); }
  dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
</style>
