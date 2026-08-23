# QA_OverFlow

Static blog powered by [Eleventy (11ty)](https://www.11ty.dev/), hosted on GitHub Pages, with a Content API (`api/`) for N8N/automation integration.

## Deploy Mapping
| Domain | Repository |
|--------|------------|
| qaoverflow.com | https://github.com/VictorHOliveira/QA_OverFlow |
| admin.qaoverflow.com | https://github.com/VictorHOliveira/GestaoFinanceiraAdmin |
| Content-API | same repo, folder `api/`, runs on the local server next to N8N (`http://localhost:3000`); cloud alternative: Railway root dir `api/` |

## Commands
| Action | Command |
|--------|---------|
| Install JS deps | `npm install` |
| Run Eleventy (dev) | `npx @11ty/eleventy --serve` |
| Run Eleventy (build) | `npx @11ty/eleventy` |
| Build + search index | `npm run build:search` |
| Run Jest tests (site) | `npm test` |
| Install API deps | `npm install` inside `api/` |
| Run API (dev, local store) | `npm run dev` inside `api/` |
| Run Jest tests (API) | `npm test` inside `api/` |
| Setup local server (Windows) | `api/deploy/setup-local.ps1` (see `SETUP-SERVIDOR.md`) |

## Project - Eleventy Build
- **Input**: `src/` (Nunjucks templates, `_data/`)
- **Output**: `_site/` (deployed to GitHub Pages)
- **Content source**: `content/posts/<slug>.json` (one file per post) + `content/posts/_manifest.json` (canonical order); aggregated by `src/_data/posts.js`. Site config in `src/_data/site.json`
- **Layout**: `src/_includes/layouts/base.njk` (Bootstrap 5, dark theme)
- **Passthrough copies**: `css/`, `images/`, `favicon.ico`, `CNAME`, `robots.txt`, `ads.txt`, `sitemap.xml`, `.nojekyll`, `manifest.json`, `sw.js`

## Features
- **Giscus comments** — via GitHub Discussions, config in `site.json.giscus`
- **Related posts** — auto-suggested by shared tags (`relatedPosts` filter in `.eleventy.js`)
- **Newsletter CTA** — Substack link in footer (`base.njk`)
- **Social links** — GitHub + LinkedIn in footer
- **Search + filters** — by category and tag (client-side JS in `index.njk`)
- **Full-text search** — Pagefind (`npm run build:search`)
- **Comment counter** — reads count from Giscus widget
- **Copy button** — on code blocks (`post.njk`)
- **Auto TOC** — sidebar + mobile table of contents from h2/h3
- **Cover images** — per-post hero image from Unsplash
- **Tag/category pages** — auto-generated pages (`/tag/*`, `/categoria/*`)
- **Read time** — estimated reading time per post
- **PWA** — manifest.json + service worker (`sw.js`)
- **SEO** — Open Graph, Twitter Cards, JSON-LD structured data (WebSite, Article, BlogPosting), RSS feed, sitemap
- **Analytics** — Google Analytics (`G-F9NWQEL01S`) + Google AdSense

## Content API (`api/`)
- Node/Express microservice for N8N integration (create/edit/list/publish posts, upload cover images)
- Storage: GitHub repo is the source of truth. In production all reads/writes go through GitHub Contents/Git Data APIs (stateless container); without `GITHUB_TOKEN` it falls back to local files (dev mode)
- Editorial flow enforced by status transitions: `draft → review → published` (and `published → draft` via `/unpublish`); `status` cannot be set directly on PUT
- Publishing commits to `main` → existing deploy.yml rebuilds and deploys (~2-3 min)
- Auth: `x-api-key` header (env `API_KEY`); helmet, CORS allowlist, rate limiting
- Endpoints: see `api/README.md`; N8N workflow recipes: `INTEGRACAO-N8N.md`
- Required env vars in production: `API_KEY`, `GITHUB_TOKEN` (fine-grained PAT with contents:write)

## Adding a Post
Manual:
1. Create `content/posts/<slug>.json` and add the slug to `content/posts/_manifest.json`
2. Run `npx @11ty/eleventy` to generate the page
3. Run `npm test` to verify

Via N8N/API: POST `/api/v1/posts` → POST `/api/v1/posts/:slug/submit-review` → POST `/api/v1/posts/:slug/publish`

Required post fields: `title`, `category`, `tags`, `summary`, `description`, `body`, `content` (HTML). Derived automatically if omitted: `slug`, `author`, `categorySlug`, `readTime`, `dated`, `datePublished`

## Custom Eleventy Filters (`.eleventy.js`)
| Filter | Purpose |
|--------|---------|
| `filter(array, prop, value)` | Filter array by property |
| `map(array, prop)` | Extract property values |
| `unique(array)` | Deduplicate array |
| `sortBy(array, prop, desc)` | Sort array by property |
| `reverse(array)` | Reverse array |
| `head(array, n)` | First N items |
| `findIndex(array, prop, value)` | Find index by property |
| `striptags(html)` | Strip HTML tags |
| `truncate(str, len, suffix)` | Truncate string |
| `urlEncode(str)` | URL encode string |
| `slugify(str)` | Convert string to URL-friendly slug |
| `relatedPosts(current, all, limit)` | Related posts by shared tags |
| `toc(html)` | Extract h2/h3 headings as TOC items |
| `addAnchors(html)` | Add anchor IDs to h2/h3 tags |

## Testing
- Site: Jest tests in `tests/`: `homepage.test.js`, `blogdata.test.js`, `posts.test.js`, `features.test.js` (target `_site/` output)
- API: Jest + Supertest in `api/tests/` (in-memory store, no network/GitHub)
- Root `npm test` runs ONLY site tests; API tests run via `npm test` inside `api/`
- CommonJS (`require()`), no TypeScript/Babel
- 102 site tests + 47 API tests

## Quirks
- UTF-8 critical for Portuguese
- `.nojekyll` present to bypass Jekyll
- CI deploys only `_site/` — legacy root files (`index.html`, `post/`, `data/`) are NOT deployed
- Eleventy 3.1.5 pinned for Node 25 compat (use `npm install @11ty/eleventy@3.1.5` if upgrading)

## CI
- GitHub Pages: `.github/workflows/deploy.yml` (push to main, ignores `api/**` and docs-only changes; daily cron rebuild at 14h UTC unaffected)
- Steps: `npm ci` → `npx @11ty/eleventy` → upload `_site/` to Pages
- Content API: `.github/workflows/api.yml` (push/PR touching `api/**`) — `npm ci` + Jest inside `api/`
