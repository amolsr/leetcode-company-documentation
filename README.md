# LeetCode Company-wise Problems — Docs (Hugo)

This folder contains a Hugo-ready documentation site for the repository `liquidslr/leetcode-company-wise-problems`.

Source repository: `https://github.com/liquidslr/leetcode-company-wise-problems/tree/main`

## Prerequisites
- Install Hugo (extended): https://gohugo.io/getting-started/installing/

## Run locally
```bash
hugo server -D
```
Then open http://localhost:1313

## Build static site
```bash
hugo
```
The static site will be generated in the `docs/` directory.

## Structure
- `config.yaml` — site configuration
- `content/` — markdown content
- `layouts/` — minimal templates (no external theme required)
- `assets/css/` — site CSS
- `static/` — static assets (images, etc.)

## Notes
- The docs provide an overview and usage guidance for the curated CSV lists from the upstream repo and link back to it for the datasets.
- You can customize navigation via `config.yaml`.

## References
- Upstream repo: `https://github.com/liquidslr/leetcode-company-wise-problems/tree/main`
- System design notes (related): `https://github.com/liquidslr/system-design-notes`
