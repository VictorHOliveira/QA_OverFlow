# QA_OverFlow

Static blog powered by [Eleventy (11ty)](https://www.11ty.dev/), hosted on GitHub Pages.

## Deploy Mapping
| Domain | Repository |
|--------|------------|
| qaoverflow.com | https://github.com/VictorHOliveira/QA_OverFlow |
| admin.qaoverflow.com | https://github.com/VictorHOliveira/GestaoFinanceiraAdmin |

## Commands
| Action | Command |
|--------|---------|
| Install JS deps | `npm install` |
| Run Eleventy (dev) | `npx @11ty/eleventy --serve` |
| Run Eleventy (build) | `npx @11ty/eleventy` |
| Run Jest tests | `npm test` |

## Project - Eleventy Build
- **Input**: `src/` (Nunjucks templates, `_data/`)
- **Output**: `_site/` (deployed to GitHub Pages)
- **Content source**: `src/_data/posts.json` (9 posts), `src/_data/site.json` (site config)
- **Layout**: `src/_includes/layouts/base.njk` (Bootstrap 5, dark theme)
- **Passthrough copies**: `css/`, `images/`, `favicon.ico`, `CNAME`, `robots.txt`, `ads.txt`, `sitemap.xml`, `.nojekyll`

## Testing
- Jest tests in `tests/`: `homepage.test.js`, `blogdata.test.js`, `posts.test.js`
- All tests target the Eleventy output (`_site/`)
- CommonJS (`require()`), no TypeScript/Babel

## Quirks
- UTF-8 critical for Portuguese
- `.nojekyll` present to bypass Jekyll
- CI deploys only `_site/` — legacy root files (`index.html`, `post/`, `data/`) are NOT deployed
- Eleventy 3.1.5 pinned for Node 25 compat (use `npm install @11ty/eleventy@3.1.5` if upgrading)

## CI
- GitHub Pages: `.github/workflows/deploy.yml` (push to main)
- Steps: `npm ci` → `npx @11ty/eleventy` → upload `_site/` to Pages
