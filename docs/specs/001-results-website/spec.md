# 001 Results Website

- **Date:** 2026-10-11
- **Status:** draft
- **Repo:** `BenchCommons/website`. Reads, but does not change, `BenchCommons/benchmark-tool` (BT) and `BenchCommons/ssg-frameworks` (SF).
- **Related:** BT `008-benchmark-methodology` (suites, `results.json`, `suite-summary.csv`, fingerprints), BT `009-output-quality` (`quality` section, `quality-summary.csv`), SF `generators.json` (generator metadata).

## Context

Benchmark rounds are published today as one self-contained HTML page built by a throwaway script (`build.py` plus a template) and hosted as a claude.ai artifact. It works, but the data path and the failure classification live outside every repository. The page also can't be linked to a filtered view, and only its author can rebuild it.

The TechEmpower Framework Benchmarks site is the reference for how a benchmark project presents results. It has an introduction and motivation, results grouped by test type, a filter panel, a data table, a rank-order view, an environment section, previous rounds and links to every view. Its source is not published and carries no license. This project copies its information architecture, not its code, styles, images or text.

The website is a static Svelte app. At build time it reads the result files committed in BT and the generator metadata in SF, and it is deployed to Cloudflare Workers as static assets.

## Requirements

### Data

- **R-1** BT and SF are git submodules in `data/benchmark-tool` and `data/ssg-frameworks`, each pinned to a commit. The build reads only files inside them, not the network.
- **R-2** `scripts/build-data.mjs` finds every round directory `data/benchmark-tool/docs/results/<YYYY-MM-DD>/`. For each suite directory (`P`, `M`, `G`, `GG`) in it, the script reads `suite-summary.csv` and every `<cell>/results.json`. Directories that do not match the date pattern (`example-*`) are skipped.
- **R-3** The script writes `public/data/rounds.json`, the round index. Each round entry holds:
  - its id (the date) and the suites present;
  - the generator count and the workflow run ids, when the round `README.md` links them;
  - the environment summary from `results.json` `environment`, `resources` and `fingerprints`.
- **R-4** For each round, the script writes `public/data/rounds/<id>.json`. Each cell (suite plus `numberOfFiles`/`contentSize`) holds:
  - the `ok` rows, with generator, language, median, CV, min, max, posts per second, peak RSS, output files and fingerprint;
  - the failed rows, with generator and classified `kind`.
- **R-5** Failures are classified into one `kind`, in this order:
  - `oom`, `timeout`, `nonconformant` or `unsupported`, when the row's `status` is that value;
  - `heap`, when `failureReason` contains `exited 134` or `exited 133`;
  - `error`, when the reason is anything else;
  - `missing`, when the generator ran in the round's other cells but has no row in this one.

  The raw `failureReason` is kept next to `kind`.
- **R-6** When `results.json` has a `quality` section, the round file gets one quality row per generator: status, `postSource`, the 4 mobile and 4 desktop Lighthouse scores of the post page, mobile LCP, post JS bytes, `jsClass`, gzip bytes, HTML errors, axe violations, broken links and SEO `present/total`. The values come from `results.json` `quality` as BT 009 R-17 defines it, not from `quality-summary.csv`.
- **R-7** Generator metadata (display name, language, runtime family, `category`, homepage, repository, license, version) is joined from SF `generators.json` by `id`. The runtime family is the first word of `runtime` (`Node.js`, `JVM`, `.NET`, …). A generator in the results but missing from `generators.json` keeps its id as its name and gets `unknown` as language, runtime and category.
- **R-8** The build fails with a message naming the file when a result file does not parse or a required CSV column is missing. It never publishes a partial round silently.

### Pages

- **R-9** Navigation lives in the URL hash, and every state is a link. Keys:
  - `section`: `intro`, `results`, `quality`, `environment` or `rounds`;
  - `round`, `suite` and `cell`;
  - `view`: `chart`, `table` or `composite`;
  - filters: `lang`, `runtime`, `category` and `status`, as comma lists.

  Loading a link restores the same view. Unknown or missing keys fall back to the latest round, suite P, the first cell and `chart`.
- **R-10** **Introduction:** what is measured (a cold build of the same reference site), why, how a round runs, and links to BT 008, BT 009, SF and the result files of the shown round.
- **R-11** **Results:**
  - one tab per suite present in the round, with its page count (P 50, M 1,000, G 10,000, GG 100,000), and a selector for the post sizes present (5 KB, 50 KB);
  - `chart`: horizontal bars of the median build time, sorted ascending, with the value, CV and generator language. A toggle switches between a linear and a log scale;
  - `table`: every ok row with all R-4 columns, sortable by any column;
  - every view lists the failed generators for the cell, with `kind` and the raw reason on hover or focus.
- **R-12** **Composite:** one row per generator and one column per cell of the round. Each cell shows the generator's rank and median, or its failure `kind`. Rows are sorted by the number of cells completed (descending), then by the geometric mean of their rank percentiles over completed cells. No single combined score is shown.
- **R-13** **Filter panel**, shared by Results, Composite and Quality:
  - checkboxes for language, runtime family, category and status (`ok`, each failure `kind`), each group with "enable all" and "disable all";
  - filters hide rows but never change a rank: ranks are computed over the whole cell;
  - a count shows how many generators are visible, out of the total.
- **R-14** **Quality:** the R-6 rows in a sortable table, with a mobile/desktop toggle and `postSource` shown on every row. The page explains, as BT 009 R-19 does, that SEO points missing from the reference templates are the same for every generator. When the round has no quality data, the section says so.
- **R-15** **Environment:** per round, the runner image, CPU and memory limits, swap, profile, Node heap, toolset commit, quality tool versions and the distinct hardware fingerprints with how many generators ran on each. It states that medians from different fingerprints are shown side by side for reading, and that BT's official rankings compare only generators that shared a fingerprint.
- **R-16** **Previous rounds:** a list of every round with date, suites and generator count, each linking to its Results.
  - Choosing a second round opens a comparison for one cell: the median of each generator in both rounds and the ratio between them.
  - Generators that appear in only one round are listed apart.

### Design and build

- **R-17** The site has its own visual design: a light and dark theme from `prefers-color-scheme` with a manual toggle, system fonts and no third-party requests at runtime. Nothing is taken from the TechEmpower site: no CSS, images, logo or copy.
- **R-18** It is usable at 360 px wide with no horizontal page scroll. The data table scrolls inside its own container.
- **R-19** `npm run build` runs `build-data` and then `vite build`, and writes static files to `dist/`. The app loads `rounds.json` first and fetches a round file only when that round is shown.
- **R-20** The site is deployed to Cloudflare Workers with static assets (`wrangler.jsonc` with `assets.directory = "./dist"` and no Worker script). A GitHub Actions workflow deploys `main` with `wrangler deploy`, and uploads a preview version for each pull request with `wrangler versions upload`. The workflow reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from repository secrets.

## Goals and success criteria

1. **The data is reproducible.** *Measured by:* running `npm run build` twice on the same submodule commits gives byte-identical `public/data/`. Vitest tests cover each R-5 kind, the R-7 fallback and the R-8 failures, each using fixture CSV and JSON files.
2. **Every view is a link.** *Measured by:* a Playwright test opens a hash with a round, suite, cell, view and filter set, and checks that the same tab, rows and checkboxes are shown. It then reloads and checks the same state again.
3. **Filters never change ranks.** *Measured by:* a Vitest test filters a cell to one language and asserts that each visible rank matches its rank in the unfiltered cell.
4. **It shows every round in BT.** *Measured by:* with the submodules on `main`, the Previous rounds list has one entry per dated directory in `docs/results/`, and a Playwright test opens the Results, Composite, Quality and Environment sections of the latest round without console errors.
5. **The site passes its own audit.** *Measured by:* CI runs Lighthouse on the built Results page (mobile preset) and fails below 0.9 on performance, accessibility, best practices and SEO.
6. **It deploys.** *Measured by:* a push to `main` serves the new build on the Workers URL, and a pull request gets a preview URL in its checks.

## Testing

- **Vitest:**
  - CSV and JSON parsing, the R-5 classification, quality row extraction, the metadata join and its fallback;
  - composite ordering and rank percentiles;
  - the filter logic;
  - hash encoding and decoding round trips.
- **Playwright smoke:** each section on the built site, the R-9 link restore, the 360 px layout (no horizontal scroll) and the theme toggle.
- **Lighthouse CI:** the Results page, as goal 5 defines it.

## Out of scope

- Uploading or pasting a `results.json` to view it (TechEmpower's "Shared Results"). This is tracked as an issue.
- Any server code, database or API: the site is static.
- Changes to BT result formats or SF metadata. If the site needs a field BT does not write, that change gets its own BT spec.
- A custom domain. The site is served on the `workers.dev` URL until one is chosen.
- Translations: the site is in English, like the result files.
- Running or scheduling benchmarks from the site.
