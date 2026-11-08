# Read-only syntax preflight for Windows PowerShell 5.1+.
# The launcher supplies an absolute ScriptsRoot explicitly.
# Resolve defaults in the body, never while binding parameter defaults.
[CmdletBinding()]
param(
    [AllowNull()]
    [AllowEmptyString()]
    [string]$ScriptsRoot
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

try {
    if (-not $PSBoundParameters.ContainsKey('ScriptsRoot')) {
        # PSCommandPath describes this file, not the caller's working directory.
        if (-not [string]::IsNullOrWhiteSpace($PSCommandPath)) {
            $ScriptsRoot = [System.IO.Path]::GetDirectoryName($PSCommandPath)
        } elseif (-not [string]::IsNullOrWhiteSpace($PSScriptRoot)) {
            $ScriptsRoot = $PSScriptRoot
        }
    }

    # Reject missing/blank paths BEFORE invoking any filesystem cmdlet.
    if ([string]::IsNullOrWhiteSpace($ScriptsRoot)) {
        throw 'Pasta dos scripts vazia. Execute INSTALAR.cmd do pacote hotfix2, ou informe -ScriptsRoot com o caminho completo.'
    }
    if (-not [System.IO.Path]::IsPathRooted($ScriptsRoot)) {
        throw 'ScriptsRoot precisa ser um caminho absoluto. Nenhuma instalacao foi iniciada.'
    }
    if (-not (Test-Path -LiteralPath $ScriptsRoot -PathType Container)) {
        throw ('Pasta dos scripts nao encontrada: {0}' -f $ScriptsRoot)
    }
    $resolved = Resolve-Path -LiteralPath $ScriptsRoot -ErrorAction Stop
    if ($resolved.Provider.Name -ne 'FileSystem') {
        throw 'A pasta dos scripts precisa pertencer ao sistema de arquivos.'
    }
    $ScriptsRoot = $resolved.ProviderPath

    Write-Host ('POWERSHELL_VERSAO={0}' -f $PSVersionTable.PSVersion)
    Write-Host ('PASTA_SCRIPTS={0}' -f $ScriptsRoot)
    $files = @(Get-ChildItem -LiteralPath $ScriptsRoot -Filter '*.ps1' -File -Recurse | Sort-Object FullName)
    if ($files.Count -eq 0) { throw 'Nenhum script PowerShell foi encontrado para verificar.' }

    $invalidFiles = 0
    foreach ($file in $files) {
        $tokens = $null
        $parseErrors = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile(
            $file.FullName,
            [ref]$tokens,
            [ref]$parseErrors
        )
        if ($parseErrors -and $parseErrors.Count -gt 0) {
            $invalidFiles++
            foreach ($parseError in $parseErrors) {
                Write-Host ('[ERRO] {0}, linha {1}, coluna {2}: {3}' -f
                    $file.Name,
                    $parseError.Extent.StartLineNumber,
                    $parseError.Extent.StartColumnNumber,
                    $parseError.Message
                ) -ForegroundColor Red
            }
        } else {
            Write-Host ('[SINTAXE OK] {0}' -f $file.Name)
        }
    }

    if ($invalidFiles -gt 0) {
        Write-Host 'A instalacao nao foi iniciada: corrija os erros de sintaxe indicados acima.' -ForegroundColor Red
        exit 1
    }

    Write-Host ('POWERSHELL_SINTAXE_OK={0}' -f $files.Count) -ForegroundColor Green
    exit 0
} catch {
    Write-Host ('VERIFICACAO_INTERROMPIDA: {0}' -f $_.Exception.Message) -ForegroundColor Red
    if ($null -ne $_.InvocationInfo) {
        Write-Host ('LOCAL_ERRO={0}:{1}' -f $_.InvocationInfo.ScriptName, $_.InvocationInfo.ScriptLineNumber)
    }
    Write-Host ('POWERSHELL_VERSAO={0}' -f $PSVersionTable.PSVersion)
    Write-Host 'A verificacao parou antes de iniciar Install-Lume.ps1.' -ForegroundColor Yellow
    exit 1
}
