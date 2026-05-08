# QA_OverFlow

Static blog hosted on GitHub Pages.

## Deploy Mapping
| Domain | Repository |
|--------|------------|
| qaoverflow.com | https://github.com/VictorHOliveira/QA_OverFlow |
| admin.qaoverflow.com | https://github.com/VictorHOliveira/GestaoFinanceiraAdmin |

## Commands
| Action | Command |
|--------|---------|
| Install JS deps | `npm install` |
| Run Jest tests | `npm test` |

## Project
- **QA Overflow Blog**: Static HTML, GitHub Pages. Content source: `data/blog.json`. Posts in `post/<slug>/index.html`. No build step.

## Testing
- Jest tests in `tests/`: `homepage.test.js`, `blogdata.test.js`, `posts.test.js`
- Reports written to `tests/report/`
- CommonJS (`require()`), no TypeScript/Babel

## Quirks
- UTF-8 critical for Portuguese; existing files may have encoding issues
- Root site deploys entire repo root to Pages; `.nojekyll` present to bypass Jekyll

## CI
- GitHub Pages: `.github/workflows/deploy.yml` (push to main)
