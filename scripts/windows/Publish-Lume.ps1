[CmdletBinding()]
param([string]$InstallRoot=(Join-Path $env:LOCALAPPDATA 'Lume'))
. (Join-Path $PSScriptRoot 'Common.ps1')
Assert-Windows
$ok=$false
$transcript=$false
try {
    $current=Read-Json (Join-Path $InstallRoot 'current.json')
    $validation=Read-Json (Join-Path $current.release 'validation.json')
    if (-not $current.validated -or -not $validation.validated) { throw 'Instalacao nao validada. Nao publicarei arquivos.' }
    $receipt=Test-Receipt $current.source
    $git=(Get-Command git.exe -ErrorAction Stop).Source
    $repository='https://github.com/Gcorrea05/lume-spending-compass.git'
    $publishLog=Join-Path $current.logs ('github-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.log')
    Start-Transcript -Path $publishLog | Out-Null
    $transcript=$true
    Write-Host 'Publicacao dos arquivos validados; usa sua autenticacao Git habitual.' -ForegroundColor Cyan
    Write-Host 'Nao ha token embutido no instalador. Nao sera usado force push.'
    $headLine=& $git ls-remote $repository refs/heads/main
    if ($LASTEXITCODE -ne 0 -or -not $headLine) { throw 'Nao consegui consultar a branch main.' }
    $remoteHead=($headLine -split '\s+')[0]
    $publicationPath=Join-Path $current.release 'github-publication.json'
    if (Test-Path -LiteralPath $publicationPath) {
        $previousPublication=Read-Json $publicationPath
        if ($remoteHead -eq $previousPublication.commit) {
            Write-Host "Esta entrega ja esta publicada: $remoteHead" -ForegroundColor Green
            $ok=$true
            return
        }
    }
    if ($remoteHead -ne $receipt.baseCommit) { throw 'A main mudou desde a base do pacote. Publicacao interrompida para nao sobrescrever trabalho novo.' }
    $clone=Join-Path $InstallRoot ('publication\'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[Guid]::NewGuid().ToString('N').Substring(0,8))
    Ensure-Directory (Split-Path $clone)
    Invoke-Native $git @('clone','--branch','main','--single-branch',$repository,$clone) $InstallRoot
    $localHead=(& $git -C $clone rev-parse HEAD).Trim()
    if ($localHead -ne $receipt.baseCommit) { throw 'O repositorio mudou durante a clonagem. Nao publicarei.' }
    $userName=& $git -C $clone config user.name
    $userEmail=& $git -C $clone config user.email
    if (-not $userName -or -not $userEmail) { throw 'Configure user.name e user.email no seu Git antes de publicar. O pacote nao inventa sua identidade.' }
    foreach ($entry in $receipt.files.PSObject.Properties) {
        $relativeName = $entry.Name.Replace('\','/')
        if ($relativeName -match '(?i)\.(exe|dll|msi|msix|zip|7z|tar|gz)$' -or $relativeName -match '(?i)(^|/)(node_modules|dist|tools|downloads|runtime|\.git)(/|$)') {
            throw ('Publicacao bloqueada: arquivo local ou binario nao permitido: {0}' -f $entry.Name)
        }
        $from=Get-SafeChild $current.source $entry.Name
        $to=Get-SafeChild $clone $entry.Name
        Ensure-Directory (Split-Path $to)
        Copy-Item -LiteralPath $from -Destination $to -Force
        Invoke-Native $git @('add','--',$entry.Name) $clone
    }
    $logPath=Join-Path $clone 'docs/VALIDACAO-LOCAL-0.2.0.json'
    Ensure-Directory (Split-Path $logPath)
    # No machine names, user paths, credentials or personal expenses in the public report.
    Write-Json $logPath ([ordered]@{version=$validation.version;baseCommit=$receipt.baseCommit;validatedAt=$validation.validatedAt;node=$validation.node;bun=$validation.bun;checks=$validation.checks;browserPassed=$validation.browserPassed;browserFailed=$validation.browserFailed;limitations=$validation.limitations;sourceHashes=$receipt.files})
    Invoke-Native $git @('add','--','docs/VALIDACAO-LOCAL-0.2.0.json') $clone
    Invoke-Native $git @('diff','--cached','--check') $clone
    Invoke-Native $git @('commit','-m','feat(frontend): expense entry form, typed review and regression checks') $clone
    # Ordinary fast-forward push rejects concurrent changes; never force or rewrite history.
    Invoke-Native $git @('push','origin','HEAD:refs/heads/main') $clone
    $published=(& $git -C $clone rev-parse HEAD).Trim()
    $confirmed=(& $git ls-remote $repository refs/heads/main) -split '\s+'
    if ($LASTEXITCODE -ne 0 -or $confirmed[0] -ne $published) { throw 'Push enviado, mas nao foi possivel confirmar a revisao remota. Consulte o log.' }
    Write-Json (Join-Path $current.release 'github-publication.json') @{commit=$published;repository=$repository;publishedAt=(Get-Date).ToUniversalTime().ToString('o')}
    Write-Host "GITHUB_PUBLICADO=$published" -ForegroundColor Green
    $ok=$true
} catch { Write-Host "GITHUB_NAO_PUBLICADO: $($_.Exception.Message)" -ForegroundColor Red }
finally { if ($transcript) { Stop-Transcript | Out-Null } }
if (-not $ok) { exit 1 }
