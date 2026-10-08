$ErrorActionPreference = 'Stop'

# Dev Brain — deterministic decision engine + JEV advisory.
#
# Port note (2026-09-29): Dev Brain's own default is 3000. Keywire owns :4700
# (moved off :3000 on 2026-10-07). 3450 is the port Recourse's DEV_BRAIN_URL
# already defaults to, so both sides agree with no .env edit.
$root = 'C:\Users\User\Downloads\BUSINESS\INFRASTRUCTURE\Dev-Brain'
$port = 3450

if (-not (Test-Path -LiteralPath $root)) {
  throw "Dev Brain root not found: $root"
}

$env:PORT = "$port"
$env:DEV_BRAIN_API_URL = "http://127.0.0.1:$port"

# JEV tier 1 (TypeSafe over the Vercel AI Gateway). jevClient resolves the
# Keywire vault name AI_GATEWAY_API_KEY, then falls back to the env of the same
# name. Rather than copy the secret into a second plaintext .env, read it from
# the DSH credential store the user already maintains, so there is exactly one
# place to rotate it.
$creds = 'C:\Users\User\.dsh\.credentials.yaml'
if (Test-Path -LiteralPath $creds) {
  $m = Select-String -LiteralPath $creds -Pattern '^\s*VERCEL_AI_GATEWAY_API_KEY:\s*(\S+)' | Select-Object -First 1
  if ($m -and $m.Matches[0].Groups[1].Value) {
    $env:AI_GATEWAY_API_KEY = $m.Matches[0].Groups[1].Value
    Write-Host 'JEV:   tier 1 key loaded from DSH credential store (Vercel AI Gateway)'
  }
}
if (-not $env:AI_GATEWAY_API_KEY) {
  Write-Host 'JEV:   no gateway key found - JEV will report source offline (honest, not fatal)'
}

$proc = Start-Process -FilePath 'npx.cmd' `
  -ArgumentList 'tsx', 'server.ts' `
  -WorkingDirectory $root `
  -NoNewWindow -PassThru `
  -RedirectStandardOutput "$root\devbrain.log" `
  -RedirectStandardError "$root\devbrain.err"

Write-Host "PID:  $($proc.Id)"
$proc.Id | Out-File "$root\devbrain.pid"
Write-Host "API:  http://127.0.0.1:$port"
Write-Host "Logs: devbrain.log / devbrain.err"
Start-Sleep 15
