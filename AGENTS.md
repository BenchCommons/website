# AGENTS.md — website-results

Follow the org-wide rules in [BenchCommons/.github AGENTS.md](https://github.com/BenchCommons/.github/blob/main/AGENTS.md) and the decisions in [.product](https://github.com/BenchCommons/.product). This file only adds what is specific to this repo.

## Role
Site: publishes BenchCommons benchmark results. It currently shows SSGBerk; support for several families is tracked in issue #5.

## Stack and commands
- Svelte 5 with Vite. Node >= 24. Tests: Vitest, Playwright and Lighthouse CI. Deployed to Cloudflare Workers as static assets.
- Data comes from git submodules in `data/`, namely tools-benchmark results and catalog-ssg `generators.json`. `scripts/build-data.mjs` writes `public/data/*.json`.

## Rules
- Consume the results format owned by tools-benchmark. Do not invent ad-hoc data files.
- A new round only appears after the data submodules are bumped.
