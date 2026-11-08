# Instalador — hotfix2

## Erro tratado

`VERIFICACAO_INTERROMPIDA: ... LiteralPath ... cadeia de caracteres vazia`.
O launcher não passava o diretório explicitamente. O preflight tinha um valor
padrão dependente de contexto e não validava a ausência antes de `Test-Path`.

## Alterações

- Launcher: `-ScriptsRoot` explícito, caminho absoluto entre aspas, sem expansão
  atrasada de variáveis do CMD.
- Verificador: padrão resolvido no corpo a partir do próprio script, rejeição
  antecipada de raiz vazia/relativa e diagnóstico com arquivo, linha e versão.
- Nenhuma mudança nas telas, no FinanceBot ou no Tailscale.
- Mantidas verificação de hash, análise pelo parser e parada quando houver falha.

## Limite de validação

A preparação ocorreu em Linux sem PowerShell instalado. Checagens textuais e
testes de Node não comprovam execução em Windows. Testes PowerShell estão
incluídos e são marcados como não executados quando o host não está disponível.

Referências de sintaxe:
- https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1
- https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_scripts?view=powershell-5.1
