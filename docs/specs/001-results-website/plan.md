# 001 Results Website: Plan

**Spec:** [spec.md](./spec.md)

**Goal:** a static Svelte site that turns the BT result files and the SF generator metadata into linkable views of every round, deployed to Cloudflare Workers.

**Architecture:** two halves with a JSON contract between them.

1. `scripts/build-data.mjs` runs in Node at build time. It reads the submodules and writes `public/data/rounds.json` and `public/data/rounds/<id>.json`.
2. The Svelte app reads only those JSON files.

All data logic that can be tested without a browser lives in plain ES modules under `scripts/lib/` (build time) and `src/lib/` (run time), each with Vitest tests. Svelte components only render.

**Tech stack** (versions pinned exactly in `package.json`):
- Node 24, npm, Svelte 5.57.2, Vite 8.3.4, `@sveltejs/vite-plugin-svelte` 7.3.1, `d3-dsv` 3.0.1 (CSV);
- Vitest 5.0.3, `@playwright/test` 1.64.0, `@lhci/cli` 0.15.1, wrangler 4.149.0.

JavaScript with JSDoc types, not TypeScript, to keep the toolchain small.

## Global Constraints

- The build reads only the submodules (R-1); no network at build time or at runtime (R-17).
- Nothing from the TechEmpower site: no CSS, images, logo or copy (R-17).
- Output is deterministic: sorted keys and rows, no timestamps from the build machine (goal 1).
- Ranks are computed over the whole cell before any filter (R-13).
- Layout works at 360 px with no horizontal page scroll (R-18).
- Commits are signed by `Matheus Breguêz <matbrgz@gmail.com>`, with the AI co-author only as a trailer.

## Rulings

- **BT submodule pin:** BT is pinned to `4091c07` on `docs/results-2026-10-11` until that branch is merged; then the pin moves to `main`. *Cost if wrong:* one submodule bump.
- **Run ids (R-3):** run ids are read from the round `README.md` with the regex `/actions/runs/(\d+)` on each suite table row. *Cost if wrong:* the run links are missing, and nothing else changes.
- **Composite percentile (R-12):** a generator's percentile in a cell is `rank / okCount`, where rank 1 is the fastest. The generator's composite is the geometric mean of its percentiles over its completed cells, and lower is better. *Cost if wrong:* the row order changes; no score is ever shown.

## File structure

```
.gitmodules                    data/benchmark-tool (BT), data/ssg-frameworks (SF)
package.json                   scripts: data, dev, build, test, e2e, lhci
vite.config.js  svelte.config.js  index.html
wrangler.jsonc                 static assets only
lighthouserc.json
scripts/
  build-data.mjs               CLI: argv[2] = BT root, argv[3] = SF root, argv[4] = out dir
  lib/csv.mjs                  readCsv(path, requiredColumns) → rows; throws BuildError
  lib/classify.mjs             classify(row) → kind; missingKinds(...)
  lib/meta.mjs                 loadMeta(sfRoot) → Map id → meta; metaFor(map, id)
  lib/quality.mjs              qualityRows(results) → QualityRow[]
  lib/round.mjs                buildRound(roundDir, meta) → Round; roundIndexEntry(round)
  lib/stable.mjs               stableStringify(value)
src/
  main.js  App.svelte  app.css
  lib/hash.js                  decode(hash, index) → State; encode(state) → hash
  lib/filters.js               facets(rows), applyFilters(rows, filters)
  lib/composite.js             composite(round, suite?) → CompositeRow[]
  lib/compare.js               compare(cellA, cellB) → {both, onlyA, onlyB}
  lib/format.js                seconds, bytes, percent, ints
  lib/data.js                  loadIndex(), loadRound(id), with a cache
  sections/Intro.svelte  Results.svelte  Composite.svelte  Quality.svelte
  sections/Environment.svelte  Rounds.svelte
  components/Nav.svelte  ThemeToggle.svelte  SuiteTabs.svelte  FilterPanel.svelte
  components/BarChart.svelte  DataTable.svelte  FailedList.svelte
tests/
  fixtures/bt/docs/results/2030-01-01/{README.md,P/suite-summary.csv,P/nf50-cs5/results.json,...}
  fixtures/bt/docs/results/example-2030-01.json   (must be skipped)
  fixtures/sf/generators.json
  unit/*.test.js
  e2e/*.spec.js
.github/workflows/ci.yml       test, build, e2e, lhci
.github/workflows/deploy.yml   wrangler deploy (main), wrangler versions upload (PR)
```

## Data contract

`public/data/rounds.json`:

```json
{ "schemaVersion": 1,
  "rounds": [ { "id": "2026-10-11", "suites": ["P","M","G","GG"], "generators": 63,
                "runs": {"P": "38102505695"}, "hasQuality": true } ] }
```

Rounds are sorted newest first.

`public/data/rounds/<id>.json`:

```json
{ "schemaVersion": 1, "id": "2026-10-11",
  "environment": { "runner": "ubuntu-24.04", "cpus": 4, "memoryBytes": 8589934592, "swap": false,
                   "profile": "core", "toolset": "4c6e185", "docker": "28.0.4",
                   "quality": { "lighthouse": "13.5.0", "chromium": "156.0.8078.4" },
                   "fingerprints": [ { "id": "3f2f1aaf006c", "cpuModel": "AMD EPYC 7763 64-Core Processor", "generators": 31 } ] },
  "generators": { "hugo": { "name": "Hugo", "language": "Go", "runtime": "Compiled", "category": "general",
                            "homepage": "…", "repository": "…", "license": "Apache-2.0", "version": "0.150.0" } },
  "suites": { "P": { "pages": 50, "cells": [
      { "id": "nf50-cs5", "numberOfFiles": 50, "contentSize": 5,
        "ok": [ { "framework": "zola", "rank": 1, "median": 0.11, "cv": 0.01, "min": 0.10, "max": 0.12,
                  "postsPerSecond": 450.1, "peakRssMB": 40.2, "outputFiles": 54, "runs": 5, "fingerprint": "…" } ],
        "failed": [ { "framework": "dumi", "kind": "missing", "reason": null } ] } ] } },
  "quality": [ { "framework": "hugo", "status": "ok", "postSource": "index",
                 "mobile": {"performance": 1, "accessibility": 0.82, "bestPractices": 0.77, "seo": 0.91, "lcpMs": 1232},
                 "desktop": {"performance": 1, "accessibility": 0.82, "bestPractices": 0.77, "seo": 0.91, "lcpMs": 300},
                 "postJsBytes": 0, "jsClass": "none", "gzipBytes": 116423, "htmlErrors": 66,
                 "axeViolations": 5, "brokenLinks": 500, "seoPresent": 4, "seoTotal": 12, "error": null } ] }
```

- `environment` comes from the first cell's `results.json`:
  - `runner` is `environmentDescription`; `cpus`, `memoryBytes` and `swap` come from `resources`; `profile` is `profile`;
  - `toolset` is `environment.toolset.commit`, `docker` is `environment.docker.serverVersion`, and `quality` is `environment.quality` without `image`;
  - `fingerprints` merges `fingerprints` (generator → id) over all cells. For each id, `cpuModel` is the `Model name:` line of `environments[<generator>]` (lscpu text) for any generator on it, or `environment.cpuModel` when absent. `generators` counts distinct generators per id.
- `rank` is assigned over all ok rows of the cell, sorted by median, with ties broken by framework id.
- `quality` is `[]` when no cell has a `quality` section.
- `runtime` is the R-7 runtime family.
- In a quality row, the per-page counts (`htmlErrors`, `axeViolations`, `seoPresent`) are those of the `post` page. `seoTotal` is `seo.total`. `postJsBytes` is `js.pages.post`. A score is `lighthouse.<preset>.post.scores.<name>.median`, and `lcpMs` is `….metrics.lcp.median`. Any section with `status: error` gives `null` for its fields. An entry with top-level `status: error` keeps only `framework`, `status` and `error`.

## Classification (R-5)

```js
const DIRECT = new Set(['oom', 'timeout', 'nonconformant', 'unsupported']);
export function classify(row) {
  if (DIRECT.has(row.status)) return row.status;
  const reason = row.failureReason || '';
  if (/exited 13[34]\b/.test(reason)) return 'heap';
  return 'error';
}
```

`missing` is assigned by `buildRound`: the round's generator set is the union of frameworks in all of its `suite-summary.csv` files, and every generator absent from a cell gets `{kind: 'missing', reason: null}`.

## Hash state (R-9)

The hash is `#section=results&round=2026-10-11&suite=G&cell=nf10000-cs50&view=chart&lang=Go,Rust`.

- `decode` validates each key against the index and the loaded round, and falls back per key to the defaults in R-9.
- `encode` omits keys that equal their defaults and writes filter values sorted, so that `encode(decode(h)) === encode(decode(encode(decode(h))))`.

## Deploy (R-20)

`wrangler.jsonc`:

```jsonc
{ "name": "benchcommons-website", "compatibility_date": "2026-10-01",
  "assets": { "directory": "./dist", "not_found_handling": "single-page-application" } }
```

`deploy.yml` runs the following steps:
1. checkout with `submodules: recursive`;
2. `npm ci`;
3. `npm run build`;
4. on `push` to `main`, `npx wrangler deploy`;
5. on `pull_request`, `npx wrangler versions upload`, which prints the preview URL into the job summary.

Both steps are skipped, with a notice, when the `CLOUDFLARE_API_TOKEN` secret is empty, so that CI on forks stays green.

## Testing map

| Spec item | Test |
|---|---|
| R-2 skip, R-8 errors | `unit/round.test.js` |
| R-5 | `unit/classify.test.js` |
| R-6 | `unit/quality.test.js` |
| R-7 | `unit/meta.test.js` |
| Goal 1 | `unit/build-data.test.js`, which runs the CLI twice into two temp dirs and compares the bytes |
| R-9, goal 2 | `unit/hash.test.js`, `e2e/links.spec.js` |
| R-12 | `unit/composite.test.js` |
| R-13, goal 3 | `unit/filters.test.js` |
| R-16 | `unit/compare.test.js` |
| Goal 4, R-18 | `e2e/sections.spec.js`, `e2e/layout.spec.js` |
| Goal 5 | `lighthouserc.json` assertions in CI |
| Goal 6 | `deploy.yml` (manual check after the secrets exist) |

## Review Focus

1. **A round with only some suites** (2026-10-11 before G finished): tabs show only the suites present, and `missing` is computed only from suites that exist.
2. **A cell where every generator failed** (GG 50 KB nearly did): the chart shows an empty state and the failed list, with no division by zero in the percentiles.
3. **A `quality` entry with `status: error`** (quarkdown): the row renders with the error text and dashes, not `NaN`.
4. **A hash pointing at a round, suite or cell that does not exist** (an old link): it falls back per key and does not show a blank page.
5. **Empty CV** (GG has 1 run): it shows "—", and sorting by CV puts empties last.

Each of these has a test in the task that owns the code (see tasks.md).
