# Runbook — Rodar a Content-API no servidor local (Windows)

Objetivo: a API (`api/`) rodando na mesma máquina do N8N, em `http://localhost:3000`, com auto-start no boot e restart automático se cair. O site continua sendo publicado pelo GitHub Pages normalmente.

> Este arquivo é o roteiro para executar **no PC servidor**. Pode ser seguido por uma pessoa ou por um agente (ex.: OpenCode) rodando lá.

## Pré-requisitos
1. Windows com **Node.js ≥ 20** (LTS) — https://nodejs.org (marque "Automatically install the necessary tools" se perguntar)
2. **GITHUB_TOKEN novo**: GitHub → Settings → Developer settings → Fine-grained tokens → Generate
   - Repository access: *Only select repositories* → `QA_OverFlow`
   - Permissions: **Contents → Read and write**
   - Nunca colar o token em chats/arquivos/commits — só no prompt do setup

## Instalação (um comando)

```powershell
git clone https://github.com/VictorHOliveira/QA_OverFlow.git; cd QA_OverFlow\api\deploy
powershell -ExecutionPolicy Bypass -File .\setup-local.ps1
```

(Se o repo já existe na máquina: `git pull` e depois rode o script.)

O script faz tudo: instala dependências, pergunta `API_KEY` (Enter gera uma forte automaticamente), pede o token, valida o token contra a API do GitHub, grava o `.env`, roda os 47 testes, registra a tarefa agendada `QAOverFlow-API`, sobe a API e confere o `/health`.

Modo não-interativo (para automação/agentes):

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-local.ps1 -ApiKey "SUA_CHAVE" -GithubToken "github_pat_..." -RegisterTask
```

Flags úteis: `-SkipTests` · `-NoStart` · `-UnregisterTask` (remove a tarefa).

## Verificação pós-setup
```powershell
curl http://localhost:3000/health
curl -H "x-api-key: SUA_API_KEY" "http://localhost:3000/api/v1/posts?pageSize=1"
```
Logs contínuos: `api\logs\api-out.log`

## Configurar o N8N (mesma máquina)
- Base URL dos nós HTTP: `http://localhost:3000/api/v1`
- Header de auth nas rotas de escrita: `x-api-key: <API_KEY do .env>`
- Contrato completo dos endpoints: [`api/README.md`](api/README.md) · receitas: [`INTEGRACAO-N8N.md`](INTEGRACAO-N8N.md)

## Operação diária
| Ação | Comando |
|---|---|
| Parar | `Stop-ScheduledTask -TaskName QAOverFlow-API` |
| Iniciar | `Start-ScheduledTask -TaskName QAOverFlow-API` |
| Remover auto-start | `.\setup-local.ps1 -UnregisterTask` |
| Atualizar a API | `git pull` dentro do repo → reiniciar a tarefa |

## Troubleshooting
| Sintoma | Causa provável | Solução |
|---|---|---|
| Health check falha após setup | Porta 3000 ocupada | `netstat -ano \| findstr :3000` e libere, ou mude `PORT` no `.env` |
| N8N recebe 401/403 | API_KEY divergente entre N8N e `.env` | Copie a chave do `api\.env` para os headers do workflow |
| POST retorna 500 com erro GitHub | Token expirado/sem permissão | Gere novo PAT e atualize `GITHUB_TOKEN` no `.env`, reinicie a tarefa |
| API não sobe no boot | Sessão ainda não logada | A tarefa dispara no logon do usuário; mantenha login automático ou inicie manualmente |

## Alternativa em nuvem
Se um dia quiser tirar da máquina local: Railway (root dir `api/`) ou Render/Cloud Run — instruções na seção "Deploy no Railway" do [`api/README.md`](api/README.md). As mesmas env vars servem.
