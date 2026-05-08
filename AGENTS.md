# QA_OverFlow

2 projects: static blog + static admin app.

## Commands
| Action | Command |
|--------|---------|
| Install JS deps | `npm install` |
| Run Jest tests | `npm test` |

## Projects
- **Root**: QA Overflow Blog (static HTML, GitHub Pages). Content source: `data/blog.json`. Posts in `post/<slug>/index.html`. No build step.
- **GestaoFinanceiraAdmin/**: Vanilla JS + Supabase static app (GitHub Pages). Needs `js/config.js` with `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

## Testing
- Jest tests in `tests/`: `homepage.test.js`, `blogdata.test.js`, `posts.test.js`
- Reports written to `tests/report/`
- CommonJS (`require()`), no TypeScript/Babel

## Quirks
- UTF-8 critical for Portuguese; existing files may have encoding issues
- Root site deploys entire repo root to Pages; `.nojekyll` present to bypass Jekyll
- 2 GitHub Pages deployments: root + GestaoFinanceiraAdmin (each has own workflow)

## CI
- Root: `.github/workflows/deploy.yml` (push to main)
- GestaoFinanceiraAdmin: `GestaoFinanceiraAdmin/.github/workflows/deploy.yml` (push to main)
