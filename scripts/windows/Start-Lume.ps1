[CmdletBinding()]
param([string]$InstallRoot=(Join-Path $env:LOCALAPPDATA 'Lume'))
. (Join-Path $PSScriptRoot 'Common.ps1')
Assert-Windows
$currentFile=Join-Path $InstallRoot 'current.json'
if (-not (Test-Path $currentFile)) { throw 'Lume nao instalado. Execute INSTALAR.cmd primeiro.' }
$current=Read-Json $currentFile
if (-not $current.validated) { throw 'A versao ativa nao passou pela validacao.' }
$stateFile=Join-Path $InstallRoot 'running.json'
if (Test-Path $stateFile) {
    $state=Read-Json $stateFile
    try {
        $health=Invoke-RestMethod ("http://127.0.0.1:{0}/__lume_health" -f $state.port) -TimeoutSec 2
        if ($health.application -eq 'lume' -and $health.instance -eq $current.instance) {
            Start-Process ("http://127.0.0.1:{0}/login" -f $state.port)
            exit 0
        }
    } catch { }
}
$port=$null
foreach ($candidate in 17842..17851) {
    $probe=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$candidate)
    try { $probe.Start(); $port=$candidate; break } catch { } finally { $probe.Stop() }
}
if (-not $port) { throw 'As portas locais 17842 a 17851 estao ocupadas. Nenhum outro processo foi encerrado.' }
$script=Join-Path $current.runtime 'serve-local.mjs'
$site=Join-Path $current.runtime 'site'
$out=Join-Path $current.logs 'runtime-output.log'
$err=Join-Path $current.logs 'runtime-error.log'
$arguments='"'+$script+'" "'+$site+'" '+$port+' '+$current.instance
$process=Start-Process -FilePath $current.node -ArgumentList $arguments -WorkingDirectory $current.runtime -WindowStyle Hidden -PassThru -RedirectStandardOutput $out -RedirectStandardError $err
$state=[ordered]@{pid=$process.Id;port=$port;instance=$current.instance;node=$current.node;script=$script}
Write-Json $stateFile $state
$ready=$false
for ($i=0;$i -lt 40;$i++) {
    try {
        $health=Invoke-RestMethod ("http://127.0.0.1:{0}/__lume_health" -f $port) -TimeoutSec 1
        if ($health.application -eq 'lume' -and $health.instance -eq $current.instance) { $ready=$true; break }
    } catch { }
    if ($process.HasExited) { break }
    Start-Sleep -Milliseconds 250
}
if (-not $ready) { throw "Frontend nao respondeu. Consulte $err. Nenhum processo externo foi alterado." }
$url="http://127.0.0.1:$port/login"
Write-Host "Lume: $url"
Start-Process $url
