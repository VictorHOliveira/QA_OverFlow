param(
  [string]$ApiKey,
  [string]$GithubToken,
  [switch]$SkipTests,
  [switch]$RegisterTask,
  [switch]$NoStart,
  [switch]$UnregisterTask
)

$ErrorActionPreference = "Stop"
$taskName = "QAOverFlow-API"
$apiDir = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $apiDir ".env"
$runScript = Join-Path $PSScriptRoot "run-api.ps1"

function Info($m) { Write-Host "[setup] $m" -ForegroundColor Cyan }
function Ok($m) { Write-Host "[ok] $m" -ForegroundColor Green }
function Fail($m) { Write-Host "[erro] $m" -ForegroundColor Red; exit 1 }

if ($UnregisterTask) {
  if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Ok "Tarefa agendada '$taskName' removida."
  } else {
    Info "Tarefa '$taskName' nao existe."
  }
  exit 0
}

Info "Diretorio da API: $apiDir"

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Fail "Node.js nao encontrado. Instale o LTS em https://nodejs.org e rode este script novamente."
}
$nodeVersionOutput = & node -v
$nodeMajor = [int]($nodeVersionOutput -replace "^v(\d+)\..*$", '$1')
if ($nodeMajor -lt 20) {
  Fail "Node.js >= 20 e necessario. Encontrado: $nodeVersionOutput"
}
Ok "Node.js $nodeVersionOutput"

Set-Location $apiDir

Info "Instalando dependencias..."
if (Test-Path (Join-Path $apiDir "package-lock.json")) {
  npm ci
} else {
  npm install
}
if ($LASTEXITCODE -ne 0) { Fail "npm install falhou." }
Ok "Dependencias instaladas"

if (-not $ApiKey) {
  $typed = Read-Host "API_KEY para autenticar o N8N (Enter = gerar uma automatica)"
  if ($typed) { $ApiKey = $typed.Trim() }
}
if (-not $ApiKey) {
  $ApiKey = (& node -e "console.log(require('crypto').randomBytes(32).toString('hex'))").Trim()
  Info "API_KEY gerada automaticamente."
}

if (-not $GithubToken) {
  $secure = Read-Host "GITHUB_TOKEN (PAT fine-grained com Contents read/write)" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $GithubToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}
$GithubToken = "$GithubToken".Trim()
if (-not $GithubToken) { Fail "GITHUB_TOKEN e obrigatorio." }

Info "Validando token no GitHub..."
try {
  $headers = @{ Authorization = "Bearer $GithubToken"; Accept = "application/vnd.github+json"; "User-Agent" = "qaoverflow-setup" }
  $null = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -TimeoutSec 15
  $repo = Invoke-RestMethod -Uri "https://api.github.com/repos/VictorHOliveira/QA_OverFlow" -Headers $headers -TimeoutSec 15
  $null = $repo.permissions.write
  if (-not $repo.permissions.write) { Fail "O token nao tem permissao de escrita no repo. Recrie com Contents: Read and write." }
  Ok "Token valido com acesso de escrita ao repo $($repo.full_name)."
} catch {
  Fail "Token invalido ou sem acesso (detalhe: $($_.Exception.Message)). Gere outro em GitHub > Settings > Developer settings > Fine-grained tokens."
}

$lines = @(
  "NODE_ENV=production",
  "PORT=3000",
  "SITE_URL=https://qaoverflow.com",
  "API_KEY=$ApiKey",
  "GITHUB_TOKEN=$GithubToken",
  "GITHUB_OWNER=VictorHOliveira",
  "GITHUB_REPO=QA_OverFlow",
  "GITHUB_BRANCH=main",
  "DEFAULT_AUTHOR=Victor Oliveira",
  "CACHE_TTL_MS=30000",
  "MAX_UPLOAD_MB=5",
  "ALLOWED_ORIGINS=https://qaoverflow.com,https://www.qaoverflow.com"
)
[System.IO.File]::WriteAllLines($envPath, $lines)
Ok ".env gravado em $envPath"

if (-not $SkipTests) {
  Info "Rodando os testes da API..."
  npm test
  if ($LASTEXITCODE -ne 0) { Fail "Testes falharam. Nao siga adiante sem resolver." }
  Ok "47 testes passaram."
}

$shouldRegister = $RegisterTask
if (-not $shouldRegister -and -not $NoStart) {
  $answer = Read-Host "Registrar inicializacao automatica no boot (tarefa agendada)? (S/n)"
  $shouldRegister = ($answer -eq "" -or $answer -match "^[sSyY]")
}

if ($shouldRegister) {
  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runScript`""
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  try {
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 10 -RestartInterval (New-TimeSpan -Minutes 1)
  } catch {
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Days 3650)
  }
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "QA OverFlow Content API (localhost:3000)" -Force | Out-Null
  Ok "Tarefa '$taskName' registrada (inicia no logon, reinicia sozinha se cair)."
}

if ($NoStart) {
  Info "Pulando start automatico (-NoStart). Para iniciar manualmente:"
  Info "  Start-ScheduledTask -TaskName $taskName   (ou: node src/server.js dentro de api/)"
} else {
  if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Start-ScheduledTask -TaskName $taskName
    Info "Tarefa iniciada. Aguardando health check..."
  } else {
    Info "Iniciando a API em processo direto (sem tarefa agendada)..."
    Start-Process powershell -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File",$runScript -WindowStyle Hidden
  }

  $healthy = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 2
    try {
      $h = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 3
      if ($h.status -eq "ok") { $healthy = $true; break }
    } catch { }
  }
  if ($healthy) {
    Ok "API no ar em http://localhost:3000"
  } else {
    Fail "Health check falhou apos 40s. Veja os logs em api\logs\api-out.log"
  }
}

Write-Host ""
Write-Host "================ RESUMO ================" -ForegroundColor Yellow
Write-Host " Base URL p/ N8N : http://localhost:3000/api/v1"
Write-Host " Auth            : header x-api-key (valor da API_KEY gravada no .env)"
Write-Host " Health          : http://localhost:3000/health"
Write-Host " Listar posts    : GET http://localhost:3000/api/v1/posts?status=published"
Write-Host " Criar post      : POST http://localhost:3000/api/v1/posts"
Write-Host " Publicar        : POST .../<slug>/submit-review depois .../<slug>/publish"
Write-Host " Logs            : api\logs\api-out.log"
Write-Host " Parar/Iniciar   : Stop-ScheduledTask / Start-ScheduledTask -TaskName $taskName"
Write-Host "========================================" -ForegroundColor Yellow
