# QA OverFlow — Content API

Microserviço Node/Express que expõe CRUD + fluxo editorial dos posts do blog para integração com N8N e outras automações.

## Como funciona

- O **repositório GitHub é a fonte da verdade**: cada post é um arquivo `content/posts/<slug>.json` + `_manifest.json` (ordem canônica).
- **Produção** (com `GITHUB_TOKEN`, local ou nuvem): leituras vêm de cache em memória (TTL 30s) alimentado pela GitHub Contents API; escritas geram commits atômicos no `main` via Git Data API → o push dispara o `deploy.yml` existente → site atualizado em ~2-3 min.
- **Dev local** (sem `GITHUB_TOKEN`): lê/escreve diretamente em `content/posts/` do repo, sem commitar.
- **Testes**: store em memória, zero rede.

## Fluxo editorial

```
POST /api/v1/posts            -> status "draft"
POST .../:slug/submit-review  -> "review"
POST .../:slug/publish        -> "published" + commit no main + deploy
POST .../:slug/unpublish      -> volta para "draft" (some do site no próximo build)
```

Transições inválidas retornam `409`. O campo `status` **não** pode ser setado via PUT.

## Autenticação

Todas as rotas de escrita exigem o header:

```
x-api-key: <API_KEY>
```

(Accepts também `Authorization: Bearer <key>`.)

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | não | Liveness probe |
| GET | `/api/v1/posts` | não | Lista posts. Query: `status` (csv), `category`, `tag`, `q`, `page`, `pageSize` (max 100), `sort=date\|title`, `order=asc\|desc`. Itens vêm sem `content`/`body` |
| GET | `/api/v1/posts/:slug` | não | Post completo (inclui `content`) |
| POST | `/api/v1/posts` | sim | Cria rascunho |
| PUT | `/api/v1/posts/:slug` | sim | Atualiza campos (merge parcial) |
| DELETE | `/api/v1/posts/:slug` | sim | Remove post |
| POST | `/api/v1/posts/:slug/submit-review` | sim | `draft → review` |
| POST | `/api/v1/posts/:slug/publish` | sim | `review → published` + commit. Body opcional: `{ "datePublished": "YYYY-MM-DDTHH:mm:ss", "setDateToToday": true }` |
| POST | `/api/v1/posts/:slug/unpublish` | sim | `review\|published → draft` |
| GET | `/api/v1/taxonomy/categories` | não | Categorias com contagem |
| GET | `/api/v1/taxonomy/tags` | não | Tags com contagem (ordenadas por uso) |
| POST | `/api/v1/media/upload` | sim | Upload de imagem (multipart, campo `file`). Tipos: jpeg, png, webp, gif, avif. Máx `MAX_UPLOAD_MB` (default 5MB). Commita em `images/uploads/<ano>/` e retorna a URL pública |

### Criar post — payload

Campos obrigatórios: `title`, `category`, `tags[]`, `summary`, `description`, `body`, `content` (HTML).
Opcionais: `slug`, `author`, `coverImage` (URL http/https), `datePublished`.
Derivados automaticamente quando omitidos: `slug` (do título), `author` (`DEFAULT_AUTHOR`), `categorySlug`, `readTime`, `dated`, `datePublished` (hoje), `status=draft`.

```bash
curl -X POST https://<host>/api/v1/posts \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Novo post sobre Playwright fixtures",
    "category": "tutoriais",
    "tags": ["playwright", "fixtures"],
    "summary": "Resumo do artigo para cards e RSS.",
    "description": "Descrição SEO com até 400 caracteres.",
    "body": "Parágrafo de introdução/excerpt do post.",
    "content": "<h2>Intro</h2><p>HTML completo do artigo…</p>",
    "coverImage": "https://images.unsplash.com/photo-123?w=1200"
  }'
```

### Respostas

- Erros sempre no formato `{ "error": { "code", "message", "details?" } }`
- Validação de schema: `422 UNPROCESSABLE` com `details[]` (Ajv)
- Slug duplicado: `409 CONFLICT`
- Sem chave: `401`; chave errada: `403`

## Env vars

| Var | Obrigatória em prod | Default |
|-----|---------------------|---------|
| `PORT` | não | `3000` |
| `NODE_ENV` | não | `development` |
| `API_KEY` | **sim** | `dev-api-key` (dev only) |
| `GITHUB_TOKEN` | **sim** | — (sem token = modo local) |
| `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH` | não | `VictorHOliveira` / `QA_OverFlow` / `main` |
| `SITE_URL` | não | `https://qaoverflow.com` |
| `DEFAULT_AUTHOR` | não | `Victor Oliveira` |
| `ALLOWED_ORIGINS` | não | `https://qaoverflow.com,...` |
| `CACHE_TTL_MS` / `MAX_UPLOAD_MB` | não | `30000` / `5` |

## Rodar no servidor local Windows (setup atual)

Setup automatizado na mesma máquina do N8N — `http://localhost:3000`, auto-start no boot, restart automático e logs em `api/logs/`:

```powershell
# dentro do repo, na pasta api\deploy
.\setup-local.ps1                # interativo (Enter gera API_KEY forte)
# ou não-interativo:
.\setup-local.ps1 -ApiKey "..." -GithubToken "github_pat_..." -RegisterTask
```

Operação: tarefa agendada `QAOverFlow-API` (`Start/Stop-ScheduledTask`). Runbook completo: [`SETUP-SERVIDOR.md`](../SETUP-SERVIDOR.md).

## Deploy no Railway (alternativa em nuvem)

1. New Project → Deploy from GitHub repo `VictorHOliveira/QA_OverFlow`
2. Settings → **Root Directory**: `api`
3. Environment → adicionar `API_KEY` e `GITHUB_TOKEN` (fine-grained PAT, escopo **Contents: Read and write**, só neste repo)
4. Networking → gerar domínio público (ex.: `api.qaoverflow.com`)
5. Dockerfile é detectado automaticamente

## Testes

```bash
cd api
npm install
npm test
```

47 testes (Supertest + store em memória): auth, CRUD completo, transições de status, validação de schema, paginação/filtros, upload de mídia.
