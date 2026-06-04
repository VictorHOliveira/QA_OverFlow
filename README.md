# QA Overflow

Blog estático sobre **Quality Assurance**, **Automação de Testes** e **Qualidade de Software**, mantido por [Victor Oliveira](https://github.com/VictorHOliveira).

🔗 [qaoverflow.com](https://qaoverflow.com)

## Tecnologias

| Ferramenta | Versão | Uso |
|-----------|--------|-----|
| [Eleventy](https://www.11ty.dev/) | 3.1.5 | Gerador de site estático |
| [Nunjucks](https://mozilla.github.io/nunjucks/) | — | Template engine |
| [Bootstrap 5](https://getbootstrap.com/) | 5.3.3 | CSS framework (dark theme) |
| [Giscus](https://giscus.app/) | — | Comentários via GitHub Discussions |
| [Pagefind](https://pagefind.app/) | 1.5 | Busca full-text estática |
| [Jest](https://jestjs.io/) | 29 | Testes de regressão (102 testes) |
| [Cheerio](https://cheerio.js.org/) | 1.0 | Parse HTML nos testes |
| [GitHub Pages](https://pages.github.com/) | — | Hospedagem + CI/CD |

## Comandos

```bash
npm install                # instalar dependências
npx @11ty/eleventy         # build (saída em _site/)
npx @11ty/eleventy --serve # dev server em http://localhost:8080
npm run build:search       # build + indexação Pagefind
npm test                   # rodar testes (102 testes)
```

## Estrutura

```
src/
├── _data/
│   ├── posts.json        → 10 posts (conteúdo principal)
│   └── site.json         → configurações (URL, analytics, Giscus)
├── _includes/
│   └── layouts/
│       └── base.njk      → layout principal (header, footer, SEO)
├── index.njk             → homepage (posts + sidebar + busca + filtros)
├── post.njk              → template de post (TOC, relacionados, comentários)
├── category.njk          → páginas /categoria/:slug (automáticas)
├── tag.njk               → páginas /tag/:slug (automáticas)
├── sobre.njk             → página Sobre
├── tutoriais.njk         → página de Tutoriais
├── 404.njk               → página 404
├── rss.njk               → feed RSS
└── sitemap.njk           → XML sitemap

tests/
├── homepage.test.js      → testa _site/index.html
├── blogdata.test.js      → testa src/_data/posts.json
├── posts.test.js         → testa _site/post/<slug>/index.html
└── features.test.js      → testa SEO, sitemap, RSS, PWA, TOC, etc.
```

## Features

- **Busca full-text** via Pagefind (indexada no build)
- **Filtros** por categoria e tag (client-side)
- **Comentários** via Giscus (GitHub Discussions)
- **Posts relacionados** sugeridos por tags em comum
- **TOC automático** sidebar + mobile (h2/h3)
- **Copy button** em blocos de código
- **Cover images** por post (Unsplash)
- **Páginas automáticas** por tag (`/tag/:slug`) e categoria (`/categoria/:slug`)
- **Tempo de leitura** estimado por post
- **PWA** — manifest.json + service worker
- **Newsletter** via Substack
- **Modo escuro/claro** com toggle (persistido em localStorage)
- **Cookie banner** (GDPR consent para Analytics + AdSense)
- **Back-to-top** button
- **Skip-link** (acessibilidade)
- **SEO**: Open Graph, Twitter Cards, JSON-LD (WebSite, Article, BlogPosting, BreadcrumbList)
- **RSS feed** (`/rss.xml`) + **Sitemap** (`/sitemap.xml`)
- **Google Analytics** + **Google AdSense**
- **Responsivo** (Bootstrap 5 dark theme)

## Adicionar um Post

1. Edite `src/_data/posts.json`
2. Adicione um novo objeto com os campos: `slug`, `title`, `author`, `category`, `tags`, `datePublished`, `content`, `status`
3. Execute `npx @11ty/eleventy`
4. Execute `npm test` para verificar

## CI/CD

O deploy é automático via GitHub Actions ao fazer push na branch `main`:

1. `npm ci` — instala dependências
2. `npm run build:search` — Eleventy build + Pagefind index
3. `npm test` — verifica a saída com 102 testes
4. Upload de `_site/` para GitHub Pages (artifact)
5. Deploy automático no ambiente `github-pages`

## Licença

© 2026 Victor Oliveira. Todos os direitos reservados.
