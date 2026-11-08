# Lume — Frontend 0.1.1 · Hotfix 3

Correção cumulativa dos dois bloqueios informados no Hotfix 2:

- `dialog-close-target-focus-and-escape`: a janela deixava o alvo de 44px momentaneamente em 41,8px por causa da animação de escala. A janela agora usa apenas o efeito de opacidade; o alvo conserva tamanho mínimo de 44 × 44px. A verificação aguarda estabilidade antes de medir, sem reduzir o mínimo exigido.
- `login-text-enlargement-200-percent`: o botão “Explorar demonstração” não quebrava o texto. Com a fonte ampliada, o botão ultrapassava o formulário e produzia uma largura de documento de 399px numa tela de 390px. Os botões textuais das telas de acesso agora quebram texto e ajustam altura; os rótulos também podem mudar de linha. A página não oculta a rolagem para mascarar o problema.

## Instalar

Salve o ZIP em Downloads e use o comando entregue na conversa para conferir seu hash e extrair automaticamente. Dentro do pacote, `INSTALAR.cmd` executa a instalação por usuário sem administrador. Requer internet para obter a revisão e dependências oficiais; reutiliza os caches de ferramentas e pacotes já presentes.

Destino: `%LOCALAPPDATA%\Lume`. A instalação cria uma pasta de versão nova. Não apague as versões anteriores: elas não precisam ser removidas. A versão ativa só é trocada depois de passar por todas as verificações. O instalador PowerShell é o mesmo do Hotfix 2, com mudança somente no identificador da versão.

Nesta versão, a suíte do navegador tem 27 verificações (25 anteriores, com mais duas verificações de fonte ampliada nas outras telas de acesso). Se qualquer verificação falhar, a instalação continua sendo interrompida. Os detalhes e uma captura da falha ficam em `logs\<execucao>\browser`.

Resultado de sucesso esperado, condicionado aos testes locais:

```
{"passed":27,"failed":0}
LUME_INSTALADO=0.1.1-frontend-hotfix3
```

## Escopo da validação desta entrega

Foram reproduzidos os dois problemas em páginas HTML isoladas baseadas no markup das telas e no CSS real do pacote. No Chromium disponível neste ambiente:

- Login com fonte em 200% e tela de 390px: antes 399px, depois 390px.
- Alvo de fechar no início da escala antiga: aproximadamente 41,8 × 41,8px; sem escala: 44 × 44px.
- Login, criar conta e recuperar senha com fonte em 200%: sem exceder a largura em 320, 360, 390 e 768px (12 cenários).

Essas páginas isoladas usam utilitários Tailwind 4.1.10 e Chromium Linux. Elas não substituem o build completo do projeto (Tailwind 4.2.1), seus testes de integração, o instalador Windows ou um teclado físico de celular. A suíte completa do aplicativo será executada no seu Windows, antes da ativação.

Os logs antigos estão identificados como históricos. Não representam resultados da execução atual.

## GitHub

A tentativa direta de criar `fix/frontend-visual-hotfix3` foi recusada com HTTP 403 (`Resource not accessible by integration`). Nenhum arquivo ou commit desta correção foi publicado remotamente.

Depois de uma instalação aprovada, `PUBLICAR_GITHUB.cmd` usa a autenticação Git do seu Windows, verifica os hashes dos arquivos e publica o conjunto validado por commit/push normal. Se a main mudou desde a base, ele para sem sobrescrever trabalho novo. Não contém token, não usa force push e não publica dados pessoais.

## O que não mudou

Dados fictícios, regras financeiras, identidade visual, backend (inexistente), autenticação demonstrativa, Tailscale e FinanceBot. O login continua sem autenticação real. Não use dados sensíveis neste protótipo.
