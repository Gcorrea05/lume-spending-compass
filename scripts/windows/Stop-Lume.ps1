[CmdletBinding()]
param([string]$InstallRoot=(Join-Path $env:LOCALAPPDATA 'Lume'),[switch]$Quiet)
. (Join-Path $PSScriptRoot 'Common.ps1')
Assert-Windows
$stateFile=Join-Path $InstallRoot 'running.json'
if (-not (Test-Path $stateFile)) { if (-not $Quiet) { Write-Host 'Nenhuma instancia do Lume registrada.' }; return }
$state=Read-Json $stateFile
$targetPid=[int]$state.pid
$process=Get-CimInstance Win32_Process -Filter "ProcessId=$targetPid" -ErrorAction SilentlyContinue
if ($process) {
    $matchesPath=($process.ExecutablePath -and $process.ExecutablePath.Equals([string]$state.node,[StringComparison]::OrdinalIgnoreCase))
    $matchesArgs=($process.CommandLine -and $process.CommandLine.Contains([string]$state.instance) -and $process.CommandLine.Contains([string]$state.script))
    if (-not ($matchesPath -and $matchesArgs)) { throw 'O PID foi reutilizado ou nao pertence ao Lume. Nao encerrei o processo.' }
    Stop-Process -Id $targetPid -ErrorAction Stop
}
Remove-Item -LiteralPath $stateFile -Force
if (-not $Quiet) { Write-Host 'Servidor local do Lume encerrado. Nenhum outro Node foi encerrado.' }
