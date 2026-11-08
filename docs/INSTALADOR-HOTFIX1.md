# Instalador Lume — hotfix1

## Falha corrigida

A linha de erro do instalador usava `"Node $nodeVersion: checksum ..."`. Em uma string interpolada PowerShell, o delimitador `:` imediatamente após um nome de variável exige delimitação adequada. A correção é `"Node ${nodeVersion}: checksum ..."`.

## Proteção adicionada

O arquivo `Test-LumeSyntax.ps1` faz análise sintática de todos os `.ps1` da pasta, sem executá-los, usando `System.Management.Automation.Language.Parser.ParseFile`. `INSTALAR.cmd` só chama o instalador quando essa checagem retorna código zero. O processo não altera a política de execução global.

## Preservado

Os patches do frontend, base Git, dependências, testes, build, instalação por usuário, ativação condicional e publicação sem force push continuam os mesmos. Os hashes foram atualizados para refletir a correção e os novos arquivos.

## Validação e limites

Os testes de regressão desta correção verificam texto, encadeamento do launcher e integridade do pacote em Node. Eles não equivalem a uma execução do parser PowerShell. Este ambiente não tem Windows nem PowerShell, portanto o parser real é executado na máquina de destino pelo preflight antes da instalação. O build completo também continua pendente de execução na máquina de destino.

A tentativa de publicar a branch de correção pela integração GitHub retornou HTTP 403. Nenhum commit remoto desta correção foi criado. O publicador local existente continua condicionado à validação integral da instalação.
