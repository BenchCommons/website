# 001 Results Website: Tasks

> **For agentic workers:** use superpowers:subagent-driven-development or superpowers:executing-plans. Read [spec.md](./spec.md) and [plan.md](./plan.md) first: the plan's data contract, rulings and Review Focus apply to every task. Steps use checkboxes.

Each task ends with `npm test` green, a signed commit and a push of the feature branch.

---

### Task 1: Scaffold

**Files:** `package.json`, `vite.config.js`, `svelte.config.js`, `index.html`, `src/main.js`, `src/App.svelte`, `src/app.css`, `wrangler.jsonc`, `.gitmodules`, `.gitignore`, `.nvmrc`, `README.md`

- [ ] Add the submodules: `git submodule add https://github.com/BenchCommons/benchmark-tool data/benchmark-tool`, then check out `4091c07` in it (plan ruling); `git submodule add https://github.com/BenchCommons/ssg-frameworks data/ssg-frameworks` at the current `master`.
- [ ] `package.json` with `"type": "module"`, `"engines": {"node": ">=24"}`, exact devDependency versions from plan.md, and these scripts:
  - `data`: `node scripts/build-data.mjs data/benchmark-tool data/ssg-frameworks public/data`
  - `dev`: `npm run data && vite`
  - `build`: `npm run data && vite build`
  - `test`: `vitest run`
  - `e2e`: `playwright test`
  - `lhci`: `lhci autorun`
- [ ] `vite.config.js` with the Svelte plugin and a Vitest block `test: { include: ['tests/unit/**/*.test.js'] }`.
- [ ] `src/App.svelte` renders an `<h1>BenchCommons</h1>`. `.gitignore` covers `node_modules`, `dist`, `public/data`, `test-results`, `.lighthouseci`, `.wrangler` and `.superpowers`.
- [ ] `wrangler.jsonc` exactly as in plan.md.
- [ ] Commit the stub `scripts/build-data.mjs` that does `mkdir -p` on the output dir and writes `{"schemaVersion":1,"rounds":[]}`, so that `npm run build` succeeds and `dist/index.html` exists.
- [ ] Commit `chore: scaffold svelte site with data submodules`.

### Task 2: Build-time parsing: CSV, classification, metadata

**Files:** `scripts/lib/{csv,classify,meta,stable}.mjs`, `tests/unit/{classify,meta,csv}.test.js`, `tests/fixtures/sf/generators.json`

- [ ] `csv.mjs`:
  - `export class BuildError extends Error {}`;
  - `readCsv(path, required)` parses with `d3-dsv` `csvParse`, and throws `BuildError("<path>: missing column <c>")` for any required column that is absent, and `BuildError("<path>: <msg>")` when the file can't be read.
- [ ] `classify.mjs`: `classify(row)` exactly as in plan.md.
- [ ] `classify.test.js`:
  - one case per kind: `oom`, `timeout`, `nonconformant`, `unsupported`, `failed` with `exited 134`, `failed` with `exited 133`, and `failed` with another reason;
  - `failed` with an empty reason gives `error`.
- [ ] `meta.mjs`:
  - `loadMeta(sfRoot)` reads `generators.json` `.generators`;
  - `metaFor(map, id)` returns `{name, language, runtime, category, homepage, repository, license, version}`, where `runtime` is `runtime.split(' ')[0]` (so `Node.js 24.21.0` gives `Node.js`). For an unknown id it returns `{name: id, language: 'unknown', runtime: 'unknown', category: 'unknown'}` and nulls for the rest.
- [ ] `meta.test.js`: the Node.js runtime family, the JVM runtime family and the unknown fallback.
- [ ] `stable.mjs`: `stableStringify(v)` is JSON with object keys sorted recursively, 0 indentation and a trailing newline. Test it: two objects with the same keys in a different order give the same string.
- [ ] Commit `feat(data): csv reader, failure classification, generator metadata`.

### Task 3: Build-time rounds, quality and CLI

**Files:** `scripts/lib/{round,quality}.mjs`, `scripts/build-data.mjs`, `tests/unit/{round,quality,build-data}.test.js`, `tests/fixtures/bt/**`

- [ ] Fixture round `tests/fixtures/bt/docs/results/2030-01-01/`:
  - `README.md` with two suite rows linking `actions/runs/111` (P) and `actions/runs/222` (M);
  - `P/suite-summary.csv` with 3 generators in `nf50-cs5`: `a` ok at 1.0 s, `b` ok at 0.5 s, `c` oom. In `nf50-cs50`, only `a` (ok) and `b` (failed, `exited 134`); `c` is absent, so it becomes `missing`;
  - `P/nf50-cs5/results.json` with `environmentDescription`, `resources`, `profile`, `environment`, `fingerprints` and `environments`, plus a `quality` with `a` ok and `b` `{"status":"error","error":"boom"}`;
  - `P/nf50-cs50/results.json` without `quality`;
  - `M/suite-summary.csv` where every row has a non-ok status (Review Focus 2).

  Also add `tests/fixtures/bt/docs/results/example-2030-01.json`, which must be skipped.
- [ ] `quality.mjs`: `qualityRows(results)` maps per the plan contract and returns rows sorted by framework. Tests:
  - the `a` row has its scores and counts;
  - the `b` row is `{framework:'b', status:'error', error:'boom'}` (Review Focus 3);
  - a section with `status: error` gives nulls.
- [ ] `round.mjs`:
  - `buildRound(roundDir, meta)` reads each present suite and returns the plan's round object. It ranks ok rows by median (ties broken by id), adds the `missing` rows and builds the environment.
  - `cv` is `null` when the CSV cell is empty (Review Focus 5).
  - `listRounds(btRoot)` returns the dated directory names, sorted descending.
  - `roundIndexEntry(round, readme)` adds the run ids parsed with `/\| (P|M|G|GG) \(.*?actions\/runs\/(\d+)/`.
- [ ] `round.test.js`:
  - ranks: `b` is 1 and `a` is 2 in `nf50-cs5`;
  - `c` is `missing` in `nf50-cs50` and `oom` in `nf50-cs5`;
  - the M cell has `ok: []`;
  - the example file is not a round;
  - a CSV without `median` throws a `BuildError` naming the file (R-8).
- [ ] `build-data.mjs`:
  - writes `rounds.json` and `rounds/<id>.json` with `stableStringify`, and removes stale files only inside its own out dir's `rounds/`;
  - on a `BuildError` it prints the message and exits with code 1.
- [ ] `build-data.test.js` runs the CLI on the fixtures into two temp dirs and asserts identical bytes (goal 1). It also asserts that `rounds.json` has one round with `runs: {P: '111', M: '222'}`.
- [ ] Run `npm run data` against the real submodules and check that it prints 3 rounds (2026-10-05, 2026-10-06, 2026-10-11).
- [ ] Commit `feat(data): build round and quality json from BT results`.

### Task 4: Runtime logic: hash, filters, composite, compare, format

**Files:** `src/lib/{hash,filters,composite,compare,format}.js`, `tests/unit/{hash,filters,composite,compare,format}.test.js`

- [ ] `hash.js` per plan.md.
  - `decode(hash, index, round)` takes `round` as `null` until it is loaded, and validates `suite` and `cell` only once `round` is known.
  - Tests:
    - a full round trip;
    - defaults are omitted from `encode`;
    - filter values are sorted;
    - an unknown round, suite or cell falls back per key (Review Focus 4);
    - URL-encoded values such as `.NET` and `Node.js` survive the round trip.
- [ ] `filters.js`:
  - `facets(rows, generators)` returns the distinct values of `language`, `runtime`, `category` and `status`, where `status` is `ok` or the failure kind;
  - `applyFilters(rows, generators, filters)`: an empty selection for a group means all.
  - Test (goal 3): filter a cell to one language and assert that each visible row keeps its original `rank`.
- [ ] `composite.js`:
  - `composite(round)` returns one row per generator: `{framework, cells: {[suite/cell]: {rank, median} | {kind}}, completed, score}`, with `score` the geometric mean of `rank/okCount` (plan ruling);
  - rows are sorted by `completed` descending, then `score` ascending, then id.
  - Tests:
    - the order on a hand-made round;
    - a cell with `okCount` 0 contributes nothing and does not divide by zero (Review Focus 2).
- [ ] `compare.js`: `compare(cellA, cellB)` returns `{both: [{framework, a, b, ratio: b/a}], onlyA: [...], onlyB: [...]}`, with `both` sorted by ratio. Test: one shared, one only-A and one only-B generator.
- [ ] `format.js`:
  - `seconds(x)` gives 3 significant digits with an `s` suffix, or `—` for null;
  - `bytes(x)` gives KB/MB/GB with 1 decimal;
  - `percent(x)` gives one decimal and `%`;
  - `int(x)` uses thousands separators.

  Tests for null and for each unit boundary.
- [ ] Commit `feat(app): hash state, filters, composite and compare logic`.

### Task 5: App shell, Introduction and Environment

**Files:** `src/App.svelte`, `src/app.css`, `src/lib/data.js`, `src/components/{Nav,ThemeToggle}.svelte`, `src/sections/{Intro,Environment}.svelte`

- [ ] `app.css`:
  - color tokens on `:root`, redefined under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and again under `:root[data-theme="dark"]`;
  - the system font stack, a 16 px side gutter and an explicit `body` background.
- [ ] `ThemeToggle` cycles auto, light and dark, sets `data-theme` on `<html>`, and remembers the choice in `localStorage` inside `try/catch`.
- [ ] `data.js` provides `loadIndex()` (fetch `data/rounds.json`) and `loadRound(id)` (fetch `data/rounds/<id>.json`, cached in a `Map`).
- [ ] `App.svelte`:
  - holds `state` from `decode(location.hash, …)`;
  - listens for `hashchange`, and writes the hash with `history.replaceState` for filter changes and `location.hash` for section changes;
  - loads the round when `state.round` changes;
  - renders `Nav` and the active section.
- [ ] `Intro` covers what is measured and why, how a round runs, and the links from R-10. The text is our own.
- [ ] `Environment` covers the R-15 fields from `round.environment`, the fingerprints table and the side-by-side note.
- [ ] Commit `feat(app): shell, navigation, theme, intro and environment`.

### Task 6: Results section

**Files:** `src/sections/Results.svelte`, `src/components/{SuiteTabs,FilterPanel,BarChart,DataTable,FailedList}.svelte`

- [ ] `SuiteTabs`: one tab per suite in the round, labelled `P · 50 pages`, plus a size selector over the cells. It uses `role="tablist"` and keyboard arrows.
- [ ] `FilterPanel`: checkbox groups from `facets`, each with "Enable all" and "Disable all", and a `visible / total` count. It collapses into a `<details>` under 720 px.
- [ ] `BarChart`:
  - HTML/CSS bars, not canvas: each row has the rank, the name with its language, a bar whose width is a share of the slowest visible median (linear) or of `log10` (log), and the value with its CV;
  - an empty state when no rows are visible (Review Focus 2).
- [ ] `DataTable`:
  - the R-4 columns, sortable by click and keyboard, with `aria-sort`;
  - empty values sort last (Review Focus 5);
  - wrapped in `overflow-x: auto` (R-18).
- [ ] `FailedList`: the failed rows grouped by kind, with `reason` in a `title` and visible on focus.
- [ ] `Results`: a chart/table/composite view switch (composite routes to Task 7), with the filters applied.
- [ ] Commit `feat(app): results section with chart, table and filters`.

### Task 7: Composite and Quality sections

**Files:** `src/sections/{Composite,Quality}.svelte`

- [ ] `Composite`:
  - a table with one column per suite and cell;
  - each cell shows the rank and median, or the kind as a colored tag;
  - filters apply, and the order comes from `composite()`;
  - the header note says there is no combined score.
- [ ] `Quality`:
  - a sortable table of the quality rows with a mobile/desktop toggle;
  - error rows show their error text across the row (Review Focus 3);
  - the R-14 note, and an empty state when `quality` is `[]`.
- [ ] Commit `feat(app): composite and quality sections`.

### Task 8: Previous rounds and comparison

**Files:** `src/sections/Rounds.svelte`

- [ ] A list of the rounds from the index (date, suites, generator count, run links), each linking to `#section=results&round=<id>`.
- [ ] Compare: pick a second round (`compare=<id>` in the hash) and a suite and cell present in both. Show the `compare()` table with the ratio formatted as `×1.23`, plus the only-A and only-B lists. Add `compare` to `hash.js` with a test.
- [ ] Commit `feat(app): previous rounds and round comparison`.

### Task 9: End-to-end and Lighthouse

**Files:** `playwright.config.js`, `tests/e2e/{sections,links,layout}.spec.js`, `lighthouserc.json`

- [ ] `playwright.config.js` serves `dist/` with `vite preview --port 4173` as `webServer`, using Chromium only.
- [ ] `sections.spec.js` (goal 4): open each section of the latest round and assert:
  - a non-empty table or chart;
  - zero console errors;
  - the Rounds list count equals the number of dated directories in `data/benchmark-tool/docs/results/`.
- [ ] `links.spec.js` (goal 2): open `#section=results&round=2026-10-11&suite=G&cell=nf10000-cs50&view=table&lang=Go,Rust`, assert the G tab, the 50 KB cell, the table view and that only Go and Rust rows show; reload and assert the same again.
- [ ] `layout.spec.js` (R-18): at 360 × 800, `document.documentElement.scrollWidth <= 360` on every section, and the theme toggle changes `data-theme`.
- [ ] `lighthouserc.json`: collect `http://localhost:4173/#section=results` from `dist`, with the mobile preset and `minScore 0.9` for the 4 categories (goal 5).
- [ ] Commit `test: e2e smoke, permalinks, layout and lighthouse budget`.

### Task 10: CI and deploy

**Files:** `.github/workflows/{ci,deploy}.yml`, `README.md`

- [ ] `ci.yml`, on push and pull_request:
  1. checkout with submodules;
  2. setup-node 24 with an npm cache;
  3. `npm ci`;
  4. `npm test`;
  5. `npm run build`;
  6. `npx playwright install --with-deps chromium`;
  7. `npm run e2e`;
  8. `npm run lhci`.
- [ ] `deploy.yml` per plan.md, with `permissions: contents: read` and `concurrency: deploy-${{ github.ref }}`. The deploy steps check `env.CLOUDFLARE_API_TOKEN != ''`.
- [ ] `README.md`: what the site is, `npm ci && npm run dev`, how to bump the submodules for a new round, and the two secrets.
- [ ] Commit `ci: test, e2e, lighthouse and cloudflare workers deploy`.
- [ ] Open a GitHub issue for "Shared results: view an uploaded results.json" (spec, out of scope), and one for moving the BT submodule to `main` once `docs/results-2026-10-11` is merged.
