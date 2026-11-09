[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$PackageRoot,
    [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA 'Lume')
)
. (Join-Path $PSScriptRoot 'Common.ps1')
Assert-Windows
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'
$PackageRoot = [IO.Path]::GetFullPath($PackageRoot)
$InstallRoot = [IO.Path]::GetFullPath($InstallRoot)
$markerPath = Join-Path $InstallRoot 'install-root.json'
if (Test-Path -LiteralPath $InstallRoot) {
    if (Test-Path -LiteralPath $markerPath) {
        if ((Read-Json $markerPath).application -ne 'gcorrea05.lume.frontend') { throw 'Pasta pertence a outra aplicacao. Nao modifiquei seu conteudo.' }
    } elseif (@(Get-ChildItem -LiteralPath $InstallRoot -Force).Count -gt 0) {
        throw 'A pasta Lume ja existe e nao pertence a este instalador. Use -InstallRoot para uma pasta nova.'
    }
}
Ensure-Directory $InstallRoot
if (-not (Test-Path -LiteralPath $markerPath)) { Write-Json $markerPath @{application='gcorrea05.lume.frontend'} }
$version = '0.2.0-frontend-cadastro'
$baseCommit = 'ed289fe7e5e80749256a66496c22cc909e88cddd'
$nodeVersion = '24.22.2'
$bunVersion = '1.4.4'
$token = [Guid]::NewGuid().ToString('N')
$run = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + $token.Substring(0,8)
$release = Join-Path $InstallRoot "versions\$version-$run"
$source = Join-Path $release 'source'
$runtime = Join-Path $release 'runtime'
$tools = Join-Path $InstallRoot 'tools'
$cache = Join-Path $InstallRoot 'downloads'
$logs = Join-Path $InstallRoot "logs\$run"
foreach ($d in @($release,$runtime,$tools,$cache,$logs)) { Ensure-Directory $d }
Start-Transcript -Path (Join-Path $logs 'installation.log') -Force | Out-Null
$ok = $false
$activated = $false
$hadPrevious = $false
try {
    Write-Host 'Lume - frontend 0.2.0 (cadastro de gastos)' -ForegroundColor Cyan
    Write-Host 'Instalacao por usuario; sem banco, conta real, servico ou publicacao na internet.'
    Write-Host '[1/8] Conferindo integridade do pacote...'
    $manifest = Read-Json (Join-Path $PackageRoot 'manifest.json')
    foreach ($entry in $manifest.files.PSObject.Properties) {
        $file = Get-SafeChild $PackageRoot $entry.Name
        if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.Value) { throw "Pacote alterado: $($entry.Name)" }
    }
    Write-Host '[2/8] Preparando Node e Bun portateis...'
    $nodeName = "node-v$nodeVersion-win-x64"
    $nodeZipName = "$nodeName.zip"
    $nodeBase = "https://nodejs.org/dist/v$nodeVersion"
    $sums = (Invoke-WebRequest "$nodeBase/SHASUMS256.txt" -UseBasicParsing).Content
    $line = ($sums -split "`n" | Where-Object { $_.TrimEnd().EndsWith("  $nodeZipName") } | Select-Object -First 1)
    if (-not $line) { throw "Node ${nodeVersion}: checksum oficial nao encontrado." }
    $nodeHash = ($line.Trim() -split '\s+')[0]
    $nodeZip = Join-Path $cache $nodeZipName
    Download-Verified "$nodeBase/$nodeZipName" $nodeZip $nodeHash
    $nodeDir = Join-Path $tools $nodeName
    if (-not (Test-Path (Join-Path $nodeDir 'node.exe'))) { Expand-Archive -LiteralPath $nodeZip -DestinationPath $tools -Force }
    $node = Join-Path $nodeDir 'node.exe'
    $actualNode = (& $node --version).Trim()
    if ($LASTEXITCODE -ne 0 -or $actualNode -ne "v$nodeVersion") { throw 'Versao do Node portatil inesperada.' }
    $bunRelease = Invoke-RestMethod "https://api.github.com/repos/oven-sh/bun/releases/tags/bun-v$bunVersion" -Headers @{ 'User-Agent'='Lume-Frontend-Installer/0.1.1' }
    $asset = @($bunRelease.assets | Where-Object { $_.name -eq 'bun-windows-x64-baseline.zip' })
    if ($asset.Count -ne 1 -or $asset[0].digest -notmatch '^sha256:([0-9a-fA-F]{64})$') { throw 'Bun: artefato oficial ou checksum indisponivel.' }
    $bunHash = $asset[0].digest.Substring(7)
    $bunZip = Join-Path $cache "bun-$bunVersion-windows-x64-baseline.zip"
    Download-Verified $asset[0].browser_download_url $bunZip $bunHash
    $bunDir = Join-Path $tools "bun-$bunVersion"
    if (-not (Test-Path (Join-Path $bunDir 'bun-windows-x64-baseline\bun.exe'))) { Expand-Archive -LiteralPath $bunZip -DestinationPath $bunDir -Force }
    $bun = Join-Path $bunDir 'bun-windows-x64-baseline\bun.exe'
    $actualBun = (& $bun --version).Trim()
    if ($LASTEXITCODE -ne 0 -or $actualBun -ne $bunVersion) { throw 'Versao do Bun portatil inesperada.' }
    $env:PATH = "$nodeDir;$(Split-Path $bun);$env:PATH"
    $env:BUN_INSTALL_CACHE_DIR = Join-Path $cache 'bun-packages'
    $env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $tools 'playwright-browsers'
    $env:CI = '1'
    Write-Host '[3/8] Baixando a revisao exata do projeto e aplicando alteracoes...'
    $archive = Join-Path $release 'source-base.zip'
    Invoke-WebRequest "https://codeload.github.com/Gcorrea05/lume-spending-compass/zip/$baseCommit" -UseBasicParsing -OutFile $archive
    $expanded = Join-Path $release 'source-download'
    Expand-Archive -LiteralPath $archive -DestinationPath $expanded
    $roots = @(Get-ChildItem -LiteralPath $expanded -Directory)
    if ($roots.Count -ne 1) { throw 'Estrutura inesperada no ZIP do repositorio.' }
    Move-Item -LiteralPath $roots[0].FullName -Destination $source
    Invoke-Native $node @((Join-Path $PackageRoot 'apply-update.mjs'),$source) $source
    Write-Host '[4/8] Instalando dependencias com o lockfile preservado...'
    Invoke-Native $bun @('install','--frozen-lockfile') $source
    Write-Host '[5/8] Executando testes e verificacao de tipos...'
    Invoke-Native $node @('--test','scripts/serve-local.check.mjs') $source
    Invoke-Native $node @('node_modules/vitest/vitest.mjs','run') $source
    Invoke-Native $node @('node_modules/typescript/bin/tsc','--noEmit') $source
    Write-Host '[6/8] Compilando somente a interface para execucao local...'
    Invoke-Native $node @('node_modules/vite/bin/vite.js','build','--config','vite.local.config.ts') $source
    Invoke-Native $node @('scripts/prepare-site.mjs',(Join-Path $runtime 'site')) $source
    Copy-Item (Join-Path $source 'scripts/serve-local.mjs') $runtime
    Copy-Item (Join-Path $source 'scripts/windows/*.ps1') $runtime
    Write-Host '[7/8] Conferindo a aplicacao no Chromium (layout, zoom simulado e navegacao)...'
    $npm = Join-Path $nodeDir 'node_modules/npm/bin/npm-cli.js'
    Invoke-Native $node @($npm,'install','--ignore-scripts','--no-audit','--no-fund') (Join-Path $source 'qa')
    Invoke-Native $node @('qa/node_modules/playwright/cli.js','install','chromium') $source
    Invoke-Native $node @('qa/frontend.mjs',(Join-Path $runtime 'site'),(Join-Path $logs 'browser')) $source
    Invoke-Native $node @('qa/expense-entry.mjs',(Join-Path $runtime 'site'),(Join-Path $logs 'cadastro')) $source
    [void](Test-Receipt $source)
    $browserReport = Read-Json (Join-Path $logs 'browser/browser-report.json')
    $entryReport = Read-Json (Join-Path $logs 'cadastro/browser-report.json')
    if ($browserReport.failed -ne 0 -or $entryReport.failed -ne 0) { throw 'Ha verificacoes visuais automatizadas com falha. Versao nao ativada.' }
    $validation = [ordered]@{
        version=$version; baseCommit=$baseCommit; validated=$true; validatedAt=(Get-Date).ToUniversalTime().ToString('o');
        node=$actualNode; bun=$actualBun; checks=@('unit-tests','runtime-tests','typescript','spa-build','browser-geometry-and-flows','expense-entry-form-browser');
        browserPassed=($browserReport.passed + $entryReport.passed); browserFailed=($browserReport.failed + $entryReport.failed);
        limitations=@('Teclado fisico de celular nao testado; viewport reduzido e uma aproximacao.','Ampliacao de fonte nao substitui todos os modos de zoom do navegador.','Dados e acesso continuam demonstrativos; o cadastro apenas confere campos, sem gravacao.')
    }
    Write-Json (Join-Path $release 'validation.json') $validation
    Write-Host '[8/8] Ativando a versao validada e criando atalhos...'
    $currentFile = Join-Path $InstallRoot 'current.json'
    if (Test-Path -LiteralPath $currentFile) {
        $hadPrevious = $true
        $old = Read-Json $currentFile
        if (Test-Path (Join-Path $old.runtime 'Stop-Lume.ps1')) { & (Join-Path $old.runtime 'Stop-Lume.ps1') -InstallRoot $InstallRoot -Quiet }
        Copy-Item $currentFile (Join-Path $InstallRoot 'previous.json') -Force
    }
    $current = [ordered]@{version=$version;release=$release;source=$source;runtime=$runtime;node=$node;instance=$token;logs=$logs;validated=$true}
    Write-Json (Join-Path $InstallRoot 'current.new.json') $current
    Move-Item (Join-Path $InstallRoot 'current.new.json') $currentFile -Force
    $activated = $true
    $shell = New-Object -ComObject WScript.Shell
    $desktop = [Environment]::GetFolderPath('DesktopDirectory')
    $menu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Lume'
    Ensure-Directory $menu
    $psExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    foreach ($item in @(@('Lume','Start-Lume.ps1'),@('Parar Lume','Stop-Lume.ps1'),@('Publicar Lume no GitHub','Publish-Lume.ps1'))) {
        $shortcut = $shell.CreateShortcut((Join-Path $menu ($item[0]+'.lnk')))
        $shortcut.TargetPath = $psExe
        $shortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + (Join-Path $runtime $item[1]) + '" -InstallRoot "' + $InstallRoot + '"'
        $shortcut.WorkingDirectory = $runtime
        $shortcut.WindowStyle = 7
        $shortcut.Description = 'Lume - frontend local de demonstracao'
        $shortcut.Save()
        if ($item[0] -eq 'Lume') { Copy-Item (Join-Path $menu 'Lume.lnk') (Join-Path $desktop 'Lume.lnk') -Force }
    }
    $ok = $true
    Write-Host "LUME_INSTALADO=$version" -ForegroundColor Green
    Write-Host "Pasta: $InstallRoot"
    Write-Host "Relatorios: $logs"
    Write-Host 'GitHub ainda nao publicado. Use o atalho especifico com sua autenticacao Git habitual.' -ForegroundColor Yellow
} catch {
    if ($activated) {
        if ($hadPrevious) { Copy-Item (Join-Path $InstallRoot 'previous.json') (Join-Path $InstallRoot 'current.json') -Force }
        else { Remove-Item (Join-Path $InstallRoot 'current.json') -Force -ErrorAction SilentlyContinue }
    }
    Write-Host "INSTALACAO INTERROMPIDA: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Relatorio: $logs"
    Write-Host 'A versao anterior foi preservada; nenhum backend ou configuracao Tailscale foi alterado.'
} finally { Stop-Transcript | Out-Null }
if (-not $ok) { exit 1 }
& (Join-Path $runtime 'Start-Lume.ps1') -InstallRoot $InstallRoot
