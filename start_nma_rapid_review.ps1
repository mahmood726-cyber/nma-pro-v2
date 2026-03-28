$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$proxyUrl = 'http://127.0.0.1:8765/health'
$appUrl = 'http://127.0.0.1:8765/'
$fallbackHtml = Join-Path $root 'nma-pro-v8.0.html'
$stdoutLog = Join-Path $root 'ctgov_proxy.log'
$stderrLog = Join-Path $root 'ctgov_proxy.err.log'

function Test-CTGovHelper {
    try {
        $resp = Invoke-RestMethod -Uri $proxyUrl -TimeoutSec 2
        return $resp.ok -eq $true
    } catch {
        return $false
    }
}

function Get-PythonLauncher {
    $candidates = @(
        @{ FilePath = 'py'; ArgumentPrefix = @('-3') },
        @{ FilePath = 'python'; ArgumentPrefix = @() },
        @{ FilePath = 'python3'; ArgumentPrefix = @() }
    )

    foreach ($candidate in $candidates) {
        if (Get-Command $candidate.FilePath -ErrorAction SilentlyContinue) {
            return $candidate
        }
    }

    throw 'Python 3 was not found on PATH.'
}

if (-not (Test-CTGovHelper)) {
    $python = Get-PythonLauncher
    $proxyScript = Join-Path $root 'ctgov_proxy.py'
    $arguments = @()
    $arguments += $python.ArgumentPrefix
    $arguments += ('"{0}"' -f $proxyScript)

    Start-Process -FilePath $python.FilePath -ArgumentList ($arguments -join ' ') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog | Out-Null

    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 500
        if (Test-CTGovHelper) {
            break
        }
    }
}

if (Test-CTGovHelper) {
    Start-Process $appUrl | Out-Null
    Write-Host "CT.gov helper ready. Opened $appUrl"
} else {
    Start-Process $fallbackHtml | Out-Null
    Write-Warning "CT.gov helper did not start. Opened $fallbackHtml instead."
    Write-Warning "Review $stdoutLog and $stderrLog, then run ctgov_proxy.py manually if needed."
}
