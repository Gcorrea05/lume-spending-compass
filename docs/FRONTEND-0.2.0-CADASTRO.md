# Lume 0.2.0 — tela de cadastro de gastos

Base: `ed289fe7e5e80749256a66496c22cc909e88cddd` (frontend hotfix3 já instalado e publicado).

## Entrega

Substitui `/gastos/novo` por formulário responsivo: motivo, valor, data, categoria e forma de pagamento. Na mesma tela ficam as opções recorrente, parcelado (1 a 12 parcelas e parcela atual) e compartilhado (titular e participantes com valores manuais). A conferência exige que a divisão feche o total. A compra no crédito usa o cartão de demonstração com fechamento dia 27 e fatura inicial automática/corrigível, sem editar a data original.

O botão **Conferir cadastro** valida e mostra um resumo. Não existe gravação, envio a servidor ou atualização de saldo/lista nesta versão. Não há botão que afirme falsamente ter salvo um gasto. Campos e resumo são descartados ao sair/recarregar; alterar um campo invalida o resumo anterior.

## Limites e pontos reservados à integração

`ReviewedExpense` é contrato de conferência de frontend, não tabela de banco nem contrato de API aprovado. Não gera ocorrências, pagamentos, estornos ou reembolsos. Não escolhe política de distribuição dos centavos restantes das parcelas: mostra a divisão quando não é exata. Não define o dia mensal de referência das parcelas nem regras de histórico, retroatividade, saldo compartilhado ou combinação de recorrência com parcelamento. As marcações são capturadas no formulário, não executadas como agenda.

O cartão exibido é exemplo de desenvolvimento, não cadastro real de cartões. O projeto continua de uso individual. Nenhuma autenticação real foi implementada. Os campos de forma de pagamento e as categorias reutilizam as opções já existentes no frontend; não foram adicionados módulos.

## Separação técnica

- `src/types/expense-draft.ts`: valores editáveis e contrato de conferência.
- `src/lib/expense-draft.ts`: validação pura, moeda em centavos e sugestão demonstrativa de fatura.
- `src/components/expenses/ExpenseEntryForm.tsx`: UI controlada, acessível e sem persistência.
- `src/styles/expense-entry.css`: estilos com os tokens visuais existentes.
- `src/test/expense-draft.test.ts`: 31 testes de consistência do formulário.
- `qa/expense-entry.mjs`: 24 cenários previstos para execução na aplicação compilada.

Não foram removidos arquivos anteriores. Dashboard, rotas de acesso, modelos de consulta, dados de demonstração e dependências permanecem inalterados. Scripts de desenvolvimento são código; executáveis e ferramentas instaladas localmente não integram o payload publicado.

## Verificação e instalação

O pacote testa a revisão-base antes de substituir três arquivos existentes. Os demais arquivos são adições. O instalador mantém os testes do hotfix3, executa tipos e build e acrescenta a suíte de navegador do cadastro. Só ativa a nova versão após aprovação de ambas as suítes. O publicador usa o registro validado e um push comum, abortando se a main tiver avançado.

Os resultados completos da execução Windows ficam no computador de desenvolvimento. O arquivo `STATUS-DA-ENTREGA.json` do ZIP distingue os testes isolados já executados das verificações ainda necessárias na aplicação completa. Não interpretar conferência estática ou unitária como homologação do backend ou do navegador em produção.
