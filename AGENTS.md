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

## Features
- **Giscus comments** — via GitHub Discussions, config in `site.json.giscus`
- **Related posts** — auto-suggested by shared tags (`relatedPosts` filter in `.eleventy.js`)
- **Newsletter CTA** — Substack link in footer (`base.njk`)
- **Social links** — GitHub + LinkedIn in footer
- **Search + filters** — by category and tag (client-side JS in `index.njk`)
- **SEO** — Open Graph, Twitter Cards, JSON-LD structured data, RSS feed, sitemap
- **Analytics** — Google Analytics (`G-F9NWQEL01S`) + Google AdSense

## Adding a Post
1. Add a new object to `src/_data/posts.json`
2. Required fields: `slug`, `title`, `author`, `category`, `tags`, `datePublished`, `content`, `status`
3. Run `npx @11ty/eleventy` to generate the page
4. Run `npm test` to verify

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
| `relatedPosts(current, all, limit)` | Related posts by shared tags |

## Testing
- Jest tests in `tests/`: `homepage.test.js`, `blogdata.test.js`, `posts.test.js`
- All tests target the Eleventy output (`_site/`)
- CommonJS (`require()`), no TypeScript/Babel
- 49 tests total

## Quirks
- UTF-8 critical for Portuguese
- `.nojekyll` present to bypass Jekyll
- CI deploys only `_site/` — legacy root files (`index.html`, `post/`, `data/`) are NOT deployed
- Eleventy 3.1.5 pinned for Node 25 compat (use `npm install @11ty/eleventy@3.1.5` if upgrading)

## CI
- GitHub Pages: `.github/workflows/deploy.yml` (push to main)
- Steps: `npm ci` → `npx @11ty/eleventy` → upload `_site/` to Pages
