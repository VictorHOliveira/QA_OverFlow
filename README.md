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
| [Jest](https://jestjs.io/) | 29 | Testes de regressão |
| [Cheerio](https://cheerio.js.org/) | 1.0 | Parse HTML nos testes |
| [GitHub Pages](https://pages.github.com/) | — | Hospedagem + CI/CD |

## Comandos

```bash
npm install                # instalar dependências
npx @11ty/eleventy         # build (saída em _site/)
npx @11ty/eleventy --serve # dev server em http://localhost:8080
npm test                   # rodar testes (49 testes)
```

## Estrutura

```
src/
├── _data/
│   ├── posts.json        → 9 posts (conteúdo principal)
│   └── site.json         → configurações (URL, analytics, Giscus)
├── _includes/
│   └── layouts/
│       └── base.njk      → layout principal (header, footer, SEO)
├── index.njk             → homepage (posts + sidebar + busca)
├── post.njk              → template de post (conteúdo, relacionados, comentários)
├── sobre.njk             → página Sobre
├── tutoriais.njk         → página de Tutoriais
└── rss.njk               → feed RSS

tests/
├── homepage.test.js      → testa _site/index.html
├── blogdata.test.js       → testa src/_data/posts.json
└── posts.test.js          → testa _site/post/<slug>/index.html
```

## Features

- **Comentários** via Giscus (GitHub Discussions)
- **Posts relacionados** sugeridos por tags em comum
- **Newsletter** via Substack
- **Busca + filtros** por categoria e tag (client-side)
- **Modo escuro** (Bootstrap 5 `data-bs-theme="dark"`)
- **SEO**: Open Graph, Twitter Cards, JSON-LD
- **RSS feed** (`/rss.xml`)
- **Google Analytics** + **Google AdSense**
- **Responsivo**

## Adicionar um Post

1. Edite `src/_data/posts.json`
2. Adicione um novo objeto com os campos: `slug`, `title`, `author`, `category`, `tags`, `datePublished`, `content`, `status`
3. Execute `npx @11ty/eleventy`
4. Execute `npm test` para verificar

## CI/CD

O deploy é automático via GitHub Actions ao fazer push na branch `main`:

1. `npm ci`
2. `npx @11ty/eleventy`
3. Upload de `_site/` para GitHub Pages

## Licença

© 2026 Victor Oliveira. Todos os direitos reservados.
