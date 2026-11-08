# Shared helpers: Windows PowerShell 5.1+. No machine-wide policy or PATH changes.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Assert-Windows {
    if ($env:OS -ne 'Windows_NT') { throw 'Este pacote instala o frontend no Windows.' }
    if ($PSVersionTable.PSVersion -lt [Version]'5.1') { throw 'Use Windows PowerShell 5.1 ou superior.' }
    if (-not [Environment]::Is64BitOperatingSystem) { throw 'Este pacote requer Windows de 64 bits.' }
}
function Ensure-Directory([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { [void](New-Item -ItemType Directory -Path $Path -Force) }
}
function Get-SafeChild([string]$Root,[string]$Relative) {
    $base = [IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    $target = [IO.Path]::GetFullPath((Join-Path $Root $Relative))
    if (-not $target.StartsWith($base,[StringComparison]::OrdinalIgnoreCase)) { throw "Caminho fora da pasta do Lume: $Relative" }
    return $target
}
function Write-Json([string]$Path,$Value) {
    $text = $Value | ConvertTo-Json -Depth 15
    [IO.File]::WriteAllText($Path,$text,[Text.UTF8Encoding]::new($false))
}
function Read-Json([string]$Path) { return (Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json) }
function Invoke-Native([string]$File,[string[]]$Arguments,[string]$WorkDir) {
    Push-Location -LiteralPath $WorkDir
    try {
        & $File @Arguments
        if ($LASTEXITCODE -ne 0) { throw "Falha (codigo $LASTEXITCODE): $File $($Arguments -join ' ')" }
    } finally { Pop-Location }
}
function Download-Verified([string]$Url,[string]$Path,[string]$Sha256) {
    if ($Sha256 -notmatch '^[a-fA-F0-9]{64}$') { throw 'Checksum SHA256 ausente/invalido.' }
    if (Test-Path -LiteralPath $Path) {
        if ((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash -eq $Sha256) { return }
        Remove-Item -LiteralPath $Path -Force
    }
    Invoke-WebRequest -Uri $Url -UseBasicParsing -OutFile $Path -UserAgent 'Lume-Frontend-Installer/0.1.1'
    if ((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash -ne $Sha256) {
        Remove-Item -LiteralPath $Path -Force
        throw "Checksum divergente no download: $Url"
    }
}
function Test-Receipt([string]$Source) {
    $receipt = Read-Json (Join-Path $Source 'lume-update-files.json')
    foreach ($entry in $receipt.files.PSObject.Properties) {
        $file = Get-SafeChild $Source $entry.Name
        if (-not (Test-Path -LiteralPath $file)) { throw "Arquivo ausente: $($entry.Name)" }
        if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.Value) { throw "Arquivo alterado depois da validacao: $($entry.Name)" }
    }
    return $receipt
}
