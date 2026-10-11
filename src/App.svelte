<script>
  import Nav from './components/Nav.svelte';
  import { loadIndex, loadRound } from './lib/data.js';
  import { decode, encode } from './lib/hash.js';
  import Environment from './sections/Environment.svelte';
  import Intro from './sections/Intro.svelte';

  let index = $state(null);
  let round = $state(null);
  let state = $state(null);
  let error = $state(null);

  const entry = $derived(index && state ? index.rounds.find((r) => r.id === state.round) : null);
  const suites = $derived(entry?.suites ?? []);

  /** Applies a state change and mirrors it in the hash; section changes add a history entry. */
  function set(patch) {
    const next = { ...state, ...patch };
    const hash = encode(next, round && round.id === next.round ? round : null);
    if (patch.section && patch.section !== state.section) location.hash = hash;
    else history.replaceState(null, '', hash);
    state = decode(hash, index, round && round.id === next.round ? round : null);
  }

  function onround(id) {
    set({ round: id, suite: null, cell: null, compare: null });
  }

  $effect(() => {
    loadIndex()
      .then((i) => {
        index = i;
        state = decode(location.hash, i, null);
      })
      .catch((e) => (error = e.message));
    const onhash = () => index && (state = decode(location.hash, index, round));
    addEventListener('hashchange', onhash);
    return () => removeEventListener('hashchange', onhash);
  });

  $effect(() => {
    const id = state?.round;
    if (!id || round?.id === id) return;
    loadRound(id)
      .then((r) => {
        round = r;
        state = decode(location.hash.includes('round=') ? location.hash : encode(state, null), index, r);
      })
      .catch((e) => (error = e.message));
  });

  $effect(() => {
    if (state) document.title = `${state.section === 'intro' ? 'BenchCommons' : `BenchCommons · ${state.section} · ${state.round}`}`;
  });
</script>

{#if error}
  <main><p class="card" role="alert">Could not load the results: {error}</p></main>
{:else if !index || !state}
  <main><p class="muted">Loading results…</p></main>
{:else}
  <Nav {index} {state} {round} {onround} />
  <main id="main">
    {#if state.section === 'intro'}
      <Intro {entry} />
    {:else if !round || round.id !== state.round}
      <p class="muted">Loading round {state.round}…</p>
    {:else if state.section === 'environment'}
      <Environment {round} {entry} {suites} />
    {:else}
      <p class="muted">This section is not built yet.</p>
    {/if}
  </main>
{/if}
