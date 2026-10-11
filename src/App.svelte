<script>
  import Nav from './components/Nav.svelte';
  import { loadIndex, loadRound } from './lib/data.js';
  import { decode, encode } from './lib/hash.js';
  import Environment from './sections/Environment.svelte';
  import Intro from './sections/Intro.svelte';
  import Quality from './sections/Quality.svelte';
  import Results from './sections/Results.svelte';
  import Rounds from './sections/Rounds.svelte';

  let index = $state(null);
  let round = $state(null);
  let ui = $state(null);
  let error = $state(null);

  const entry = $derived(index && ui ? index.rounds.find((r) => r.id === ui.round) : null);
  const suites = $derived(entry?.suites ?? []);

  /** Applies a ui change and mirrors it in the hash; section changes add a history entry. */
  function set(patch) {
    const next = { ...ui, ...patch };
    const hash = encode(next, round && round.id === next.round ? round : null);
    if (patch.section && patch.section !== ui.section) location.hash = hash;
    else history.replaceState(null, '', hash);
    ui = decode(hash, index, round && round.id === next.round ? round : null);
  }

  function onround(id) {
    set({ round: id, suite: null, cell: null, compare: null });
  }

  $effect(() => {
    loadIndex()
      .then((i) => {
        index = i;
        ui = decode(location.hash, i, null);
      })
      .catch((e) => (error = e.message));
    const onhash = () => index && (ui = decode(location.hash, index, round));
    addEventListener('hashchange', onhash);
    return () => removeEventListener('hashchange', onhash);
  });

  $effect(() => {
    const id = ui?.round;
    if (!id || round?.id === id) return;
    loadRound(id)
      .then((r) => {
        round = r;
        ui = decode(location.hash.includes('round=') ? location.hash : encode(ui, null), index, r);
      })
      .catch((e) => (error = e.message));
  });

  $effect(() => {
    if (ui) document.title = `${ui.section === 'intro' ? 'BenchCommons' : `BenchCommons · ${ui.section} · ${ui.round}`}`;
  });
</script>

{#if error}
  <main><p class="card" role="alert">Could not load the results: {error}</p></main>
{:else if !index || !ui}
  <main><p class="muted">Loading results…</p></main>
{:else}
  <Nav {index} {ui} {round} {onround} />
  <main id="main">
    {#if ui.section === 'intro'}
      <Intro {entry} />
    {:else if !round || round.id !== ui.round}
      <p class="muted">Loading round {ui.round}…</p>
    {:else if ui.section === 'environment'}
      <Environment {round} {entry} {suites} />
    {:else if ui.section === 'results'}
      <Results {round} {ui} {suites} {set} />
    {:else if ui.section === 'quality'}
      <Quality {round} {ui} {set} />
    {:else if ui.section === 'rounds'}
      <Rounds {index} {round} {ui} {set} />
    {/if}
  </main>
{/if}
