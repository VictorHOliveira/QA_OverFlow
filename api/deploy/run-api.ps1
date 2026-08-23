$ErrorActionPreference = "Continue"
$apiDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $apiDir "logs"
$logFile = Join-Path $logDir "api-out.log"

if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

if ((Test-Path $logFile) -and ((Get-Item $logFile).Length -gt 20MB)) {
  Remove-Item $logFile -Force
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
  $nodeExe = $nodeCmd.Source
} elseif (Test-Path "$env:ProgramFiles\nodejs\node.exe") {
  $nodeExe = "$env:ProgramFiles\nodejs\node.exe"
} else {
  Write-Output "[run-api] Node.js nao encontrado no PATH nem em Program Files."
  exit 1
}

Set-Location $apiDir

while ($true) {
  Write-Output "[run-api] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') iniciando node src/server.js"
  & $nodeExe src/server.js *>> $logFile
  Write-Output "[run-api] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') processo saiu (code=$LASTEXITCODE). Reiniciando em 5s..." *>> $logFile
  Start-Sleep -Seconds 5
}
