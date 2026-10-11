# BenchCommons website

The results website of the BenchCommons static site generator benchmarks: every round, suite and generator from
[benchmark-tool](https://github.com/BenchCommons/benchmark-tool), with the generator metadata of
[ssg-frameworks](https://github.com/BenchCommons/ssg-frameworks). Spec, plan and tasks:
[docs/specs/001-results-website](docs/specs/001-results-website/spec.md).

It is a static Svelte app. At build time `scripts/build-data.mjs` reads the two repositories, pinned as git submodules
in `data/`, and writes `public/data/rounds.json` plus one JSON file per round. The app only reads those files.

## Develop

```sh
git clone --recurse-submodules https://github.com/BenchCommons/website
cd website
npm ci
npm run dev          # build the data, then start Vite
npm test             # unit tests (Vitest)
npm run build        # data + static site in dist/
npm run e2e          # Playwright against the built site
npm run lhci         # Lighthouse budget on the built site
```

Every view is a link: the section, round, suite, cell, view and filters live in the URL hash, for example
`#round=2026-10-11&suite=G&cell=nf10000-cs50&view=table&lang=Go,Rust`.

## Publish a new round

A round appears once its result files are on benchmark-tool `main` under `docs/results/<YYYY-MM-DD>/`. Move the
submodule to that commit and open a pull request:

```sh
git -C data/benchmark-tool fetch origin main
git -C data/benchmark-tool checkout origin/main
git -C data/ssg-frameworks fetch origin master
git -C data/ssg-frameworks checkout origin/master
npm run build
git add data && git commit -m "data: round <YYYY-MM-DD>"
```

The build fails, naming the file, if a result file doesn't parse or a CSV column is missing.

## Deploy

`main` is deployed to Cloudflare Workers as static assets (`wrangler.jsonc`), and every pull request gets a preview
version. The `deploy` workflow needs two repository secrets:

- `CLOUDFLARE_API_TOKEN`: an API token with the *Workers Scripts: Edit* permission;
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account id.

Without them the workflow builds the site and skips the deploy.

## License

MIT. The site's design and text are its own; nothing is copied from other benchmark sites.
