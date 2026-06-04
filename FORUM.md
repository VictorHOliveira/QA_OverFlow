# Fórum QA Overflow — Plano de Implementação

> **Stack:** Python + FastAPI + PostgreSQL  
> **URL:** `https://qaoverflow.com/forum`  
> **Repositório:** `forum-qaoverflow` (separado)  
> **Custo estimado:** ~$15-18/mês

---

## 1. Arquitetura

```
[Usuário]
    │
    ▼
Cloudflare (DNS + WAF + TLS)
    │
    ├── /*          ──► GitHub Pages (qaoverflow.com) — site atual, intacto
    │
    └── /forum/*    ──► Cloudflare Worker (proxy)
                              │
                              ▼
                         Railway (FastAPI + PostgreSQL)
```

| Componente | Função |
|-----------|--------|
| **Cloudflare Free** | DNS, CDN, WAF, SSL. Já está no domínio. |
| **Cloudflare Worker** | Roteia `/forum/*` para o backend Railway de forma transparente. |
| **Railway Hobby ($5/mês)** | Hospeda FastAPI + PostgreSQL. Sem cold start (sempre ativo). |
| **FastAPI** | API REST + Jinja2 templates (server-side rendering). |
| **PostgreSQL** | Dados do fórum: usuários, tópicos, respostas, tokens. |

---

## 2. Cloudflare Worker (proxy transparente)

Faz o papel de proxy reverso: mantém `qaoverflow.com/forum/...` na URL do navegador enquanto encaminha a requisição para o Railway.

- **Trigger:** Toda request com `pathname` começando com `/forum/`
- **Ação:** Remove `/forum` do path, reescreve `Host` para o domínio Railway, encaminha requisição
- **Preserva:** Cookies, headers originais, query params
- **Resposta:** Retorna direto ao cliente (streaming)
- **Custo:** $0 (Free tier — 100k req/dia)
- **Deploy:** Via `wrangler deploy` ou dashboard Cloudflare

---

## 3. Custos Mensais Detalhados

| Serviço | Item | Plano | Custo |
|---------|------|-------|-------|
| **Cloudflare** | DNS + CDN + WAF | Free | **$0** |
| **Cloudflare Worker** | Proxy `/forum/*` → Railway | Free (100k req/dia) | **$0** |
| **Railway** | FastAPI (256MB RAM, 0.25 vCPU) | Hobby | ~$7,50 |
| **Railway** | PostgreSQL (256MB RAM, 1GB storage) | Hobby | ~$7,65 |
| **Railway** | Egress (~20-60GB/mês) | Hobby | ~$1-3 |
| **Railway** | Assinatura Hobby ($5/mês inclui $5 crédito) | Hobby | $5 |
| **Domínio** | qaoverflow.com | — | $0 (já possui) |
| **GitHub** | Repositório + Actions | Free | **$0** |
| | | **Total** | **~$15-18/mês** |

### Memória de cálculo Railway

```
FastAPI (sempre ativo):
  RAM:  256MB × $10/GB/mês   = $2,50
  CPU:  0.25vCPU × $20/mês   = $5,00
  Total:                      $7,50

PostgreSQL (sempre ativo):
  RAM:  256MB × $10/GB/mês   = $2,50
  CPU:  0.25vCPU × $20/mês   = $5,00
  Storage: 1GB × $0,15/GB/mês = $0,15
  Total:                      $7,65

Egress: ~20-60GB × $0,05/GB  = $1-3

Cálculo final:
  Uso total:        $7,50 + $7,65 + $2 = ~$17
  Crédito Hobby:   -$5
  Overage:          ~$12
  Assinatura:       $5
  ─────────────────────────
  TOTAL:            ~$17/mês
```

---

## 4. Repositório — Estrutura de Pastas

```
forum-qaoverflow/
│
├── app/
│   ├── main.py                # FastAPI app, lifespan, middlewares, security headers
│   ├── config.py              # pydantic-settings (variáveis de ambiente)
│   ├── database.py            # SQLAlchemy async engine + session factory
│   ├── models.py              # ORM models: User, UserToken, Category, Topic, Reply, CsrfToken
│   ├── schemas.py             # Pydantic schemas (request/response validation)
│   ├── auth.py                # GitHub OAuth flow + JWT generation/validation
│   ├── dependencies.py        # FastAPI Depends (get_db, get_current_user, csrf_validated)
│   ├── security.py            # CSRF token, rate limit setup, sanitização nh3
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py            # GET /forum/auth/github, /forum/auth/callback
│   │   ├── forum.py           # GET/POST /forum/, /forum/novo, /forum/{id}/responder, etc.
│   │   └── users.py           # GET /forum/users/{id}
│   │
│   ├── templates/
│   │   ├── base.html          # Layout base (Bootstrap 5 dark, navbar com link "Fórum")
│   │   ├── index.html         # Listagem de tópicos (paginada, filtro por categoria)
│   │   ├── topic.html         # Tópico + respostas + botão "Marcar como solução"
│   │   ├── new_topic.html     # Editor markdown com preview
│   │   ├── login.html         # Botão "Entrar com GitHub"
│   │   └── profile.html       # Perfil público do usuário
│   │
│   └── static/                # CSS/JS específicos do fórum
│       ├── style.css
│       └── script.js
│
├── worker/
│   └── index.js               # Cloudflare Worker (proxy /forum/ → Railway)
│
├── migrations/                 # Alembic migrations
├── tests/                      # pytest + httpx
├── requirements.txt
├── Dockerfile                  # Multi-stage (otimizado)
├── railway.toml
├── wrangler.toml               # Config Cloudflare Worker
└── .env.example
```

---

## 5. Database Schema (PostgreSQL)

```sql
-- Usuários (via GitHub OAuth — sem senha armazenada)
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(100) UNIQUE NOT NULL,
    email           VARCHAR(255),            -- NUNCA exposto em páginas públicas
    avatar_url      TEXT,
    github_id       BIGINT UNIQUE NOT NULL,
    role            VARCHAR(20) DEFAULT 'user',  -- user | moderator | admin
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens (armazenados como hash SHA-256)
CREATE TABLE user_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(64) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias do fórum
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    icon            VARCHAR(50),             -- Nome do ícone Bootstrap
    sort_order      INT DEFAULT 0
);

-- Tópicos
CREATE TABLE topics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(300) NOT NULL,
    content         TEXT NOT NULL,            -- Markdown sanitizado (nh3)
    user_id         UUID NOT NULL REFERENCES users(id),
    category_id     UUID REFERENCES categories(id),
    is_pinned       BOOLEAN DEFAULT FALSE,
    is_locked       BOOLEAN DEFAULT FALSE,
    view_count      INT DEFAULT 0,
    reply_count     INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Respostas
CREATE TABLE replies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content         TEXT NOT NULL,            -- Markdown sanitizado (nh3)
    user_id         UUID NOT NULL REFERENCES users(id),
    topic_id        UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    is_solution     BOOLEAN DEFAULT FALSE,    -- Marcar como solução (QA style)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tokens CSRF (uso único)
CREATE TABLE csrf_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),   -- NULL para anon (mas formulários requerem login)
    token_hash      VARCHAR(64) NOT NULL,
    used            BOOLEAN DEFAULT FALSE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_topics_category ON topics(category_id);
CREATE INDEX idx_topics_created ON topics(created_at DESC);
CREATE INDEX idx_replies_topic ON replies(topic_id);
CREATE INDEX idx_user_tokens_user ON user_tokens(user_id);
CREATE INDEX idx_topics_search ON topics USING GIN(to_tsvector('portuguese', title || ' ' || content));
```

---

## 6. Backend — FastAPI (etapas de implementação)

### Fase 1 — Setup (1 dia)

**Objetivo:** Infraestrutura rodando.

- [ ] Cloudflare Worker criado e deployado (proxy básico)
- [ ] Railway projeto + PostgreSQL provisionado
- [ ] FastAPI "hello world" deployado no Railway
- [ ] Variáveis de ambiente configuradas:
  - `DATABASE_URL` (Railway fornece automático)
  - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
  - `JWT_SECRET` (gerado com `secrets.token_urlsafe(32)`)
  - `FORUM_BASE_URL=https://qaoverflow.com/forum`
- [ ] Worker → Railway testado (`https://qaoverflow.com/forum/` responde)

### Fase 2 — Autenticação GitHub OAuth + JWT (1-2 dias)

**Objetivo:** Usuário loga com GitHub, sessão segura via cookies.

#### Fluxo de autenticação

```
1. Usuário clica "Entrar com GitHub"
2. GET /forum/auth/github
   - Gera state aleatório, armazena hash no cookie (HttpOnly)
   - Redirect para GitHub OAuth (scope: user:email)
3. GitHub redireciona para /forum/auth/callback?code=...&state=...
   - Valida state (compara hash no cookie)
   - Troca code por access_token (POST github.com/login/oauth/access_token)
   - Busca user info (GET api.github.com/user)
   - Busca email (GET api.github.com/user/emails)
   - Cria ou atualiza User no PostgreSQL
   - Gera access_token JWT (15 min) + refresh_token (7 dias, armazenado hash no DB)
   - Seta cookies HttpOnly; Secure; SameSite=Lax; Path=/forum
   - Redirect para /forum/
4. Logout: revoga refresh_token no DB + limpa cookies
```

#### JWT — payload e validação

```
Access Token (15 min):
  sub: user_id (UUID)
  username: string
  role: string
  iat: timestamp
  exp: timestamp

Refresh Token (7 dias):
  - String aleatória (64 bytes hex)
  - Hash SHA-256 armazenado em user_tokens.token_hash
  - Rotacionado a cada uso (antigo revogado, novo gerado)
  - Se expirado ou revogado → logout forçado

Cookies:
  access_token:  HttpOnly; Secure; SameSite=Lax; Path=/forum; Max-Age=900
  refresh_token: HttpOnly; Secure; SameSite=Strict; Path=/forum/auth; Max-Age=604800
```

### Fase 3 — Segurança (aplicada em todo o resto)

| Camada | Implementação | Detalhe |
|--------|--------------|---------|
| **CSRF** | Token + middleware | Cookie `csrf_token` + hidden field `_csrf_token` em todo form POST. Middleware valida antes do handler. |
| **Sanitização** | nh3 (Rust bindings) | Limpa conteúdo HTML gerado de markdown: só tags seguras (`p`, `strong`, `em`, `a`, `code`, `pre`, `blockquote`, `ul`, `ol`, `li`, `h2-h4`, `img`). Links com `rel="noopener noreferrer ugc"`. |
| **Rate limit** | slowapi | 10 POST/min por IP em `/forum/novo` e `/responder`. 5 POST/min em `/forum/auth/*`. |
| **Security Headers** | Middleware | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **CORS** | fastapi.middleware.cors | Permitido apenas `https://qaoverflow.com` |
| **Enumeração** | Erros genéricos | "Credenciais inválidas" — nunca "usuário não encontrado" |
| **Tokens** | Rotação + revogação | Refresh token novo a cada uso; logout revoga no DB |
| **Dependências** | pip-audit | CI scan de vulnerabilidades |

#### Content-Security-Policy

```
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net https://unpkg.com;
style-src  'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
img-src    'self' https: data:;
font-src   'self' https://cdn.jsdelivr.net;
connect-src 'self' https://api.github.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

### Fase 4 — CRUD do Fórum (3-4 dias)

#### Endpoints

| Método | Rota | Função | Auth | CSRF |
|--------|------|--------|------|------|
| `GET` | `/forum/` | Listar tópicos (paginado, filtro por categoria, busca) | ❌ | ❌ |
| `GET` | `/forum/novo` | Página criar tópico | ✅ | ❌ |
| `POST` | `/forum/novo` | Criar tópico | ✅ | ✅ |
| `GET` | `/forum/{id}/{slug}` | Ver tópico + respostas | ❌ | ❌ |
| `POST` | `/forum/{id}/{slug}/responder` | Responder tópico | ✅ | ✅ |
| `POST` | `/forum/{id}/{slug}/solucao/{reply_id}` | Marcar como solução | ✅ | ✅ |
| `GET` | `/forum/categoria/{slug}` | Tópicos por categoria | ❌ | ❌ |
| `GET` | `/forum/perfil/{id}` | Perfil público do usuário | ❌ | ❌ |

#### Busca textual

- PostgreSQL Full-Text Search (índice GIN com `to_tsvector('portuguese', ...)`)
- Query params: `?q=termo&categoria=slug&page=1`
- Destacar termos no resultado

### Fase 5 — Templates Jinja2 (2-3 dias)

- **`base.html`**: Bootstrap 5 dark theme, navbar com "Fórum", footer
- **`index.html`**: Grid de tópicos, sidebar com categorias, paginação
- **`topic.html`**: Tópico principal + respostas aninhadas, form de resposta, botão "Solução"
- **`new_topic.html`**: Form com título, select categoria, textarea markdown + preview JS
- **`login.html`**: Botão "Entrar com GitHub"
- **`profile.html`**: Avatar, username, bio, stats (tópicos criados, respostas)
- **Markdown**: Renderizado server-side com `mistune` + sanitizado com `nh3`

---

## 7. Endpoints da API

```
┌──────────────┬──────────────────────────────────────┬──────────────────┐
│ Método       │ Rota                                 │ Função           │
├──────────────┼──────────────────────────────────────┼──────────────────┤
│ GET          │ /forum/                              │ Home do fórum    │
│ GET          │ /forum/?q=&categoria=&page=          │ Busca + filtro   │
│ GET          │ /forum/novo                          │ Form criar tópico│
│ POST         │ /forum/novo                          │ Criar tópico     │
│ GET          │ /forum/{id}/{slug}                   │ Ver tópico       │
│ POST         │ /forum/{id}/{slug}/responder         │ Responder        │
│ POST         │ /forum/{id}/{slug}/solucao/{rid}     │ Marcar solução   │
│ GET          │ /forum/categoria/{slug}              │ Listar categoria │
│ GET          │ /forum/perfil/{id}                   │ Perfil usuário   │
│ GET          │ /forum/auth/github                   │ Login GitHub     │
│ GET          │ /forum/auth/callback                 │ Callback OAuth   │
│ POST         │ /forum/auth/logout                   │ Logout           │
│ GET          │ /forum/auth/refresh                  │ Refresh token    │
└──────────────┴──────────────────────────────────────┴──────────────────┘
```

---

## 8. CI/CD — GitHub Actions

```yaml
# .github/workflows/deploy.yml (repo: forum-qaoverflow)

name: Deploy Forum

on:
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install bandit pip-audit
      - run: bandit -r app/ -q
      - run: pip-audit

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: forum_test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v

  deploy:
    needs: [security, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: |
          curl -fsSL https://railway.app/install.sh | sh
          railway up --service forum-api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 9. Dockerfile

```dockerfile
# Multi-stage build — imagem final ~120MB
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY app/ app/
ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 10. Cronograma (10 dias úteis)

| Dia | Fase | Entregáveis |
|-----|------|-------------|
| **1** | Setup | Worker deployado + Railway rodando + PostgreSQL + secrets |
| **2-3** | Auth | GitHub OAuth + JWT + cookies + refresh + logout |
| **4** | Segurança | CSRF + rate limit + CSP + sanitização + CORS |
| **5-7** | CRUD | Models + migrations + endpoints + busca textual |
| **8-9** | Templates | Jinja2 pages + markdown + preview + responsivo |
| **10** | CI/CD + Deploy | Actions + Docker + deploy final + teste completo |

---

## 11. Funcionalidades do Fórum

### Core
- [x] Listagem de tópicos com paginação
- [x] Criar tópico com markdown + preview
- [x] Responder tópicos
- [x] Marcar resposta como solução (estilo "pergunta respondida")
- [x] Categorias (ex: "Automação", "Carreira", "Ferramentas", "Dúvidas Gerais")
- [x] Busca textual (PostgreSQL FTS — português)
- [x] Contador de views, respostas

### Social
- [x] Login com GitHub (sem criar nova senha)
- [x] Perfil público do usuário
- [x] Avatar + username + stats
- [x] Contador de contribuições por usuário

### Moderação (admin)
- [ ] Fixar/destacar tópico no topo
- [ ] Trancar tópico (só leitura)
- [ ] Soft delete de tópico/resposta
- [ ] Gerenciar categorias (criar, editar, ordernar)

### UX
- [x] Tema escuro (consistente com o site atual)
- [x] Responsivo (Bootstrap 5)
- [x] Editor markdown com preview ao vivo
- [x] Destaque de sintaxe em blocos de código (highlight.js)
- [x] Breadcrumb navegação

---

## 12. Segurança — Resumo

| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Senhas armazenadas | ❌ Não | GitHub OAuth exclusivo |
| CSRF | ✅ Sim | Token + cookie + middleware |
| XSS (templates) | ✅ Sim | Jinja2 escapa HTML por padrão |
| XSS (conteúdo) | ✅ Sim | nh3 sanitiza markdown renderizado |
| SQL Injection | ✅ Sim | SQLAlchemy ORM + params vinculados |
| Rate limiting | ✅ Sim | slowapi (10 POST/min por IP) |
| JWT curto | ✅ Sim | 15 min access + 7d refresh (rotacionado) |
| Cookie seguro | ✅ Sim | HttpOnly + Secure + SameSite + Path escopo |
| CSP | ✅ Sim | Content-Security-Policy restritivo |
| CORS | ✅ Sim | Apenas `https://qaoverflow.com` |
| HSTS | ✅ Sim | `max-age=63072000; includeSubDomains` |
| Enumeração | ✅ Sim | Erros genéricos em auth |
| Dependências | ✅ Sim | pip-audit no CI |
| Secrets scan | ✅ Sim | detect-secrets no pre-commit |
| TLS | ✅ Sim | Cloudflare → Railway (Full strict) |
| Logout | ✅ Sim | Revoga refresh token no DB |

---

## 13. Variáveis de Ambiente

```env
# .env.example

# Railway fornece automaticamente
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/forum

# GitHub OAuth App
GITHUB_CLIENT_ID=seu_client_id
GITHUB_CLIENT_SECRET=seu_client_secret

# JWT
JWT_SECRET=seu_jwt_secret_32_bytes_hex
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Fórum
FORUM_BASE_URL=https://qaoverflow.com/forum
FORUM_TITLE=QA Overflow Fórum
FORUM_DESCRIPTION=Fórum da comunidade QA Overflow

# Admin (primeiro admin definido por env)
FORUM_ADMIN_GITHUB_ID=seu_github_id
```

---

## 14. Próximos Passos (quando quiser prosseguir)

### Passo 1 — Infraestrutura
1. Configurar Cloudflare Worker (proxy `/forum/` → Railway)
2. Criar conta Railway + projeto
3. Provisionar PostgreSQL no Railway
4. Criar repositório `forum-qaoverflow`

### Passo 2 — Backend
1. Setup FastAPI + SQLAlchemy + Alembic
2. Implementar autenticação GitHub OAuth
3. Implementar segurança (CSRF, rate limit, CSP)
4. Implementar CRUD de tópicos e respostas
5. Implementar templates Jinja2

### Passo 3 — Deploy
1. Dockerfile + railway.toml
2. GitHub Actions CI/CD
3. Deploy do Worker
4. Teste integrado completo
