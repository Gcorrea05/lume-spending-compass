# Lume — entrega de frontend 0.1.1

Base: `Gcorrea05/lume-spending-compass`, commit `fc1d465b03cb25c2174a9a90e8e808dd8fda7a7b`.

## Alterações de interface

- Layout condicionado à largura disponível do conteúdo, não apenas ao tamanho da janela.
- Tabela no desktop com espaço suficiente; cartões em tablet/notebook estreito e celular.
- Indicadores e valores com quebra controlada para ampliação de texto.
- Filtros adaptáveis; opções com área de toque confortável.
- Janelas limitadas ao viewport visível, com rolagem interna e fechamento de 44 px.
- Foco retorna ao botão de origem ao fechar o ajuste de saldo e o menu.
- Tela de acesso com espaço para o seletor de tema e rolagem em alturas pequenas.
- Link de pular para o conteúdo; ampliação do navegador não bloqueada.
- Data fictícia da demonstração explicitada no painel, sem mudar a regra do mock.

Nenhum cálculo financeiro, cadastro, autenticação real ou banco foi acrescentado. As duas paletas e a estrutura do Lovable foram preservadas. `vite.config.ts` e arquivos gerados permanecem intactos.

## Desenvolvimento / compilação local

O lockfile Bun do projeto original é preservado. Com as dependências instaladas:

```sh
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
node --test scripts/serve-local.check.mjs
node node_modules/vite/bin/vite.js build --config vite.local.config.ts
node scripts/prepare-site.mjs ./local-site
node scripts/serve-local.mjs ./local-site 17842
```

`vite.local.config.ts` é uma opção adicional para compilar uma SPA local. Não substitui a configuração do editor Lovable. O runtime serve somente os arquivos estáticos compilados em `127.0.0.1`, não possui API financeira, banco ou autenticação.

## Validação visual automatizada

```sh
cd qa
npm install --ignore-scripts
cd ..
node qa/node_modules/playwright/cli.js install chromium
node qa/frontend.mjs ./local-site ./qa-results
```

A rotina verifica sete larguras (360, 390, 768, 1024, 1279, 1280 e 1920), os dois temas, fechamento/foco, filtros, fontes ampliadas e viewport baixo. Produz screenshots e `browser-report.json` e retorna código diferente de zero em caso de falha.

Um viewport baixo é aproximação de teclado aberto, não teste em aparelho físico. Fonte de 200% não equivale a todas as formas de zoom. A revisão humana de aparência continua necessária.

## Windows e publicação

Os scripts em `scripts/windows` integram o pacote `Lume-Frontend-v0.1.1.zip`. O instalador requer a estrutura completa do pacote (incluindo manifest, mapa de patches e fonte dos novos arquivos), não apenas o `.ps1` isolado.

A instalação usa uma pasta por versão em `%LOCALAPPDATA%\Lume`, ferramentas portáteis e atalhos do usuário. Não muda PATH global, firewall, serviços, FinanceBot nem Tailscale. Os dados continuam simulados e o saldo volta ao padrão ao recarregar.

Após todos os testes e build passarem, uma versão pode ser ativada. A publicação é separada: `Publish-Lume.ps1` usa o Git autenticado do titular, verifica hashes e a revisão remota, envia somente os arquivos autorizados e nunca usa force push. Se a `main` mudou, interrompe para evitar substituir alterações recentes.

## Situação desta entrega

Na preparação do pacote, foram executados testes isolados do servidor estático e do aplicador de patches, além de análise sintática dos novos arquivos. Não houve execução do aplicativo React completo ou do instalador Windows no ambiente de preparação. Os 14 testes originais não foram reexecutados ali.

A tentativa de publicar por esta integração GitHub retornou HTTP 403 (`Resource not accessible by integration`). Não há commit desta entrega confirmado no remoto. A publicação exige escrita autorizada ou execução do publicador com as credenciais Git habituais do titular, depois da validação local.
