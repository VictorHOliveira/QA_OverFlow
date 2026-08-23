# Integração N8N ↔ QA OverFlow

Receitas prontas para o N8N (em outra máquina) criar, revisar, publicar e consultar as matérias do blog via Content API.

**Base URL (produção):** `https://api.qaoverflow.com` (domínio gerado no Railway)
**Auth:** todas as rotas de escrita exigem header `x-api-key: <API_KEY>`

---

## 1. Credenciais no N8N

Crie uma credencial **Header Auth** (ou use Header direto nos nós HTTP Request):

```
x-api-key: <valor da env API_KEY configurada no Railway>
```

## 2. Workflow A — Criar matéria (rascunho)

Disparo sugerido: **Form Submission / Telegram / Schedule / Manual Trigger** com campos `topico`, `palavras_chave`.

### Nó 1 — HTTP Request: gerar conteúdo (opcional)
Chame seu LLM (OpenAI/Groq node) para produzir:
```json
{
  "title": "...",
  "summary": "resumo até 400 chars",
  "description": "descrição SEO até 400 chars",
  "body": "parágrafo de introdução",
  "content": "<h2>...</h2><p>HTML completo do artigo</p>",
  "tags": ["tag1", "tag2"]
}
```
> Regras de conteúdo: `content` em HTML válido; h2/h3 viram TOC automático no site; mínimo ~50 chars.

### Nó 2 — HTTP Request: criar rascunho
```
Method: POST
URL:   https://api.qaoverflow.com/api/v1/posts
Headers: x-api-key: *****, Content-Type: application/json

Body (JSON):
{
  "title":       "{{ $json.title }}",
  "category":    "{{ $json.category }}",        // ex.: tutoriais | boas-praticas | carreira | ferramentas
  "tags":        {{ JSON.stringify($json.tags) }},
  "summary":     "{{ $json.summary }}",
  "description": "{{ $json.description }}",
  "body":        "{{ $json.body }}",
  "content":     "{{ JSON.stringify($json.content) }}",
  "coverImage":  "{{ $json.coverImage }}"       // opcional, URL http(s)
}
```
Resposta 201 → guarde `data.slug`. O post fica `draft` (invisível no site) e já é commitado no repo.

### Nó 3 — (opcional) Notificar revisão
Telegram/Slack/E-mail: `"Novo rascunho aguardando revisão: {{ slug }}"`.

## 3. Workflow B — Revisar e publicar

### Nó 1 — HTTP Request: enviar para revisão
```
POST https://api.qaoverflow.com/api/v1/posts/{{ $json.slug }}/submit-review
```

### Nó 2 — Aprovação humana (recomendado)
- **Opção simples:** nó **Wait** + aprovação via Telegram/Slack (botão Approve/Reject)
- **Opção robusta:** Form Trigger listando posts em `review`:

```
GET https://api.qaoverflow.com/api/v1/posts?status=review&pageSize=50
```

### Nó 3 — HTTP Request: publicar
```
POST https://api.qaoverflow.com/api/v1/posts/{{ $json.slug }}/publish

Body opcional (agendar publicação):
{ "datePublished": "2026-09-01T07:00:00" }
```
O publish commita no `main` → GitHub Actions rebuilda → **site ao ar em ~2-3 min**.
Se `datePublished` for futuro, o post só aparece no site quando a data chegar (o build diário às 14h UTC cuida disso).

## 4. Workflow C — Consultar posts (ex.: relatório, reuso de conteúdo)

```
GET https://api.qaoverflow.com/api/v1/posts?status=published&page=1&pageSize=20&sort=date&order=desc
```

Filtros disponíveis: `status` (csv), `category`, `tag`, `q` (busca em título/resumo), `page`, `pageSize`.
A lista vem sem `content`/`body`; para o artigo completo:

```
GET https://api.qaoverflow.com/api/v1/posts/<slug>
```

Úteis também:
- `GET /api/v1/taxonomy/categories` — categorias + contagens
- `GET /api/v1/taxonomy/tags` — tags mais usadas

## 5. Workflow D — Upload de capa gerada por IA

```
POST https://api.qaoverflow.com/api/v1/media/upload
Content-Type: multipart/form-data
Field name: file
```
No nó HTTP Request do N8N: **Send Binary File**, apontando o output binário do nó gerador de imagem.
Resposta: `{ "data": { "url": "https://qaoverflow.com/images/uploads/2026/arquivo.png", ... } }`
Use essa `url` no campo `coverImage`.

## 6. Tratamento de erros

| HTTP | Significado | Ação no N8N |
|------|-------------|-------------|
| 401/403 | API_KEY ausente/incorreta | Revisar credencial |
| 404 | Slug não existe | Conferir `GET /posts` antes |
| 409 | Slug duplicado ou transição inválida (ex.: publish direto do draft) | Seguir o fluxo draft→review→publish |
| 413 | Payload/imagem grande demais | Reduzir tamanho |
| 422 | Validação de schema falhou (`error.details[]` diz os campos) | Corrigir payload |

Dica: ative **Retry on Fail** (2-3 tentativas, 5s) nos nós POST/PUT — commits concorrentes no GitHub podem conflitar momentaneamente (a API já tenta 3x internamente).

## 7. Checklist de setup completo

- [ ] Railway: deploy da pasta `api/` com `API_KEY` e `GITHUB_TOKEN` (PAT fine-grained, Contents: Read and write, apenas repo QA_OverFlow)
- [ ] Domínio público gerado (sugestão: `api.qaoverflow.com`)
- [ ] N8N: credencial Header Auth criada
- [ ] Teste ponta a ponta: criar draft → submit-review → publish → conferir qaoverflow.com atualizado
