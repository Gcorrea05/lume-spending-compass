import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Info, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { createExpenseDraft, expenseInvoice, parseExpenseMoney, reviewExpenseDraft } from "@/lib/expense-draft";
import { CATEGORIES, categoryLabel } from "@/types/finance";
import type { ExpenseDraft, ExpenseDraftErrors, ReviewedExpense } from "@/types/expense-draft";

interface ExpenseEntryFormProps {
  /** Future integration callback. This version only reviews the form in memory. */
  onReviewed?: (value: ReviewedExpense) => void;
}

function Field({ id, label, help, error, children }: {
  id: string; label: string; help?: string; error?: string | undefined; children: ReactNode;
}) {
  return (
    <div className="expense-entry__field">
      <label htmlFor={id}>{label}</label>
      {children}
      {help && <p id={`${id}-help`} className="expense-entry__help">{help}</p>}
      {error && <p id={`${id}-error`} className="expense-entry__error">{error}</p>}
    </div>
  );
}

function Choice({ id, checked, title, detail, onChange }: {
  id: string; checked: boolean; title: string; detail: string; onChange: (value: boolean) => void;
}) {
  return (
    <label className="expense-entry__choice" htmlFor={id} data-selected={checked}>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span><strong>{title}</strong><small>{detail}</small></span>
    </label>
  );
}

const dateLabel = (iso: string) => iso.split("-").reverse().join("/");
const monthLabel = (iso: string) => {
  const [year, month] = iso.split("-");
  return `${month}/${year}`;
};

function InstallmentPreview({ value, count }: { value: number; count: number }) {
  // Do not invent a cent-distribution policy. Only show an exact division when possible.
  return value % count === 0 ? <>{formatBRL(value / count)}</> : <>{formatBRL(value)} ÷ {count}</>;
}

export function ExpenseEntryForm({ onReviewed }: ExpenseEntryFormProps) {
  const [draft, setDraft] = useState<ExpenseDraft>(createExpenseDraft);
  const [errors, setErrors] = useState<ExpenseDraftErrors>({});
  const [reviewed, setReviewed] = useState<ReviewedExpense | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const nextId = useRef(2);

  const change = (update: Partial<ExpenseDraft>) => {
    setDraft(previous => ({ ...previous, ...update }));
    setReviewed(null);
    setErrors({});
  };
  const updateParticipant = (index: number, update: Partial<ExpenseDraft["participants"][number]>) => {
    change({ participants: draft.participants.map((p, i) => i === index ? { ...p, ...update } : p) });
  };
  const accessibility = (id: string, help = false) => ({
    id,
    "aria-invalid": errors[id] ? true as const : undefined,
    "aria-describedby": [help ? `${id}-help` : "", errors[id] ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined,
  });

  const total = parseExpenseMoney(draft.amount);
  const amounts = draft.participants.map(p => parseExpenseMoney(p.amount));
  const allocated = amounts.every(v => v !== null) ? amounts.reduce<number>((sum, v) => sum + (v ?? 0), 0) : null;
  const remaining = total !== null && allocated !== null ? total - allocated : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = reviewExpenseDraft(draft);
    if (!result.ok) {
      setReviewed(null);
      setErrors(result.errors);
      requestAnimationFrame(() => {
        const input = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (input) input.focus();
        else formRef.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
      });
      return;
    }
    setErrors({});
    setReviewed(result.value);
    onReviewed?.(result.value);
    requestAnimationFrame(() => resultRef.current?.focus());
  };

  return (
    <div className="expense-entry">
      <div className="expense-entry__notice" role="note">
        <Info aria-hidden="true" />
        <p><strong>Cadastro em desenvolvimento.</strong> Preencha e confira usando dados fictícios. Esta etapa não grava despesas nem altera seu saldo.</p>
      </div>
      <form ref={formRef} noValidate onSubmit={submit} className="expense-entry__form">
        {Object.keys(errors).length > 0 && (
          <div role="alert" tabIndex={-1} className="expense-entry__alert">
            Revise os campos indicados antes de conferir o gasto.
            {errors["expense-shares"] && <p>{errors["expense-shares"]}</p>}
          </div>
        )}

        <section className="surface-card expense-entry__section" aria-labelledby="expense-details-title">
          <h2 id="expense-details-title">Dados do gasto</h2>
          <p className="expense-entry__intro">O que foi gasto, quando e em qual categoria.</p>
          <div className="expense-entry__grid">
            <div className="expense-entry__full">
              <Field id="expense-description" label="Motivo" error={errors["expense-description"]}>
                <input {...accessibility("expense-description")} name="description" type="text" maxLength={200} required autoComplete="off" placeholder="Ex.: supermercado, internet ou tablet" value={draft.description} onChange={e => change({ description: e.target.value })} />
              </Field>
            </div>
            <Field id="expense-amount" label={draft.installment ? "Valor total da compra (R$)" : "Valor do gasto (R$)"} help={draft.installment ? "Informe o total da compra, não apenas a parcela." : "Use vírgula para os centavos. Ex.: 150,00."} error={errors["expense-amount"]}>
              <input {...accessibility("expense-amount", true)} name="amount" type="text" inputMode="decimal" required autoComplete="off" placeholder="0,00" value={draft.amount} onChange={e => change({ amount: e.target.value })} />
            </Field>
            <Field id="expense-date" label={draft.installment ? "Data original da compra" : draft.recurring ? "Data de cobrança" : "Data do gasto"} error={errors["expense-date"]}>
              <input {...accessibility("expense-date")} name="date" type="date" required value={draft.date} onChange={e => change({ date: e.target.value })} />
            </Field>
            <Field id="expense-category" label="Tipo / Categoria" error={errors["expense-category"]}>
              <select {...accessibility("expense-category")} name="category" required value={draft.category} onChange={e => change({ category: e.target.value as ExpenseDraft["category"] })}>
                <option value="">Selecione uma categoria</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field id="expense-payment" label="Forma de pagamento" error={errors["expense-payment"]}>
              <select {...accessibility("expense-payment")} name="payment" required value={draft.payment} onChange={e => change({ payment: e.target.value as ExpenseDraft["payment"] })}>
                <option value="">Selecione uma opção</option>
                <option value="pix">Pix</option><option value="debito">Débito</option><option value="credito">Cartão de crédito</option>
              </select>
            </Field>
          </div>
          {draft.payment === "credito" && (
            <div className="expense-entry__inset" data-testid="expense-card-fields">
              <p><strong>Cartão principal — demonstração</strong><br /><span className="expense-entry__help">Fechamento dia 27. Compras a partir desse dia entram na próxima fatura.</span></p>
              <Field id="expense-invoice" label="Fatura inicial da compra" help="Identificada pelo mês do fechamento. Você pode corrigir a atribuição, sem mudar a data original." error={errors["expense-invoice"]}>
                <input {...accessibility("expense-invoice", true)} name="invoiceMonth" type="month" required value={expenseInvoice(draft)} onChange={e => change({ invoiceMonth: e.target.value, invoiceManual: true })} />
              </Field>
              {draft.invoiceManual && <Button type="button" variant="ghost" className="expense-entry__action" onClick={() => change({ invoiceManual: false, invoiceMonth: "" })}>Usar fatura automática</Button>}
            </div>
          )}
        </section>

        <section className="surface-card expense-entry__section" aria-labelledby="expense-kind-title">
          <h2 id="expense-kind-title">Como este gasto funciona?</h2>
          <p className="expense-entry__intro">Sem marcar opções, o gasto é avulso. Parcelas e compartilhamento ficam nesta mesma tela.</p>
          <div className="expense-entry__choices">
            <Choice id="expense-recurring" checked={draft.recurring} title="Fixo / recorrente" detail="Repete nos meses seguintes" onChange={recurring => change({ recurring })} />
            <Choice id="expense-installment" checked={draft.installment} title="Parcelado" detail="Compra dividida em parcelas" onChange={installment => change({ installment })} />
            <Choice id="expense-shared" checked={draft.shared} title="Compartilhado" detail="Dividido entre pessoas" onChange={shared => change({ shared })} />
          </div>
          {draft.recurring && <p className="expense-entry__inset expense-entry__help">Recorrência mensal. A regra aprovada permite ajustar um mês sem alterar os demais; a geração das ocorrências será conectada na etapa de gravação.</p>}
          {draft.installment && (
            <div className="expense-entry__inset" data-testid="expense-installment-fields">
              <div className="expense-entry__grid">
                <Field id="expense-installments" label="Quantidade de parcelas" error={errors["expense-installments"]}>
                  <select {...accessibility("expense-installments")} value={draft.installmentCount} onChange={e => {
                    const count = Number(e.target.value);
                    change({ installmentCount: count, currentInstallment: Math.min(draft.currentInstallment, count) });
                  }}>
                    {Array.from({ length: 12 }, (_, i) => <option value={i + 1} key={i + 1}>{i + 1}x</option>)}
                  </select>
                </Field>
                <Field id="expense-current-installment" label="Parcela atual" error={errors["expense-current-installment"]}>
                  <select {...accessibility("expense-current-installment")} value={draft.currentInstallment} onChange={e => change({ currentInstallment: Number(e.target.value) })}>
                    {Array.from({ length: draft.installmentCount }, (_, i) => <option value={i + 1} key={i + 1}>{i + 1} de {draft.installmentCount}</option>)}
                  </select>
                </Field>
              </div>
              {total !== null && total > 0 && <p className="expense-entry__help">Valor de referência por parcela: <strong className="num"><InstallmentPreview value={total} count={draft.installmentCount} /></strong>. O total não será contado novamente em cada mês.</p>}
              {total !== null && total % draft.installmentCount !== 0 && <p className="expense-entry__help">Divisão com centavos restantes. Esta conferência não distribui nem arredonda as parcelas automaticamente.</p>}
            </div>
          )}
        </section>

        {draft.shared && (
          <section className="surface-card expense-entry__section" aria-labelledby="expense-shared-title" data-testid="expense-participants">
            <h2 id="expense-shared-title">Divisão entre pessoas</h2>
            <p className="expense-entry__intro">Informe sua parte e o valor de cada participante. A soma precisa fechar o total, sem divisão automática.</p>
            <div className="expense-entry__participants">
              {draft.participants.map((p, index) => (
                <div className="expense-entry__participant" key={p.id}>
                  <Field id={`expense-person-${index}`} label={p.isOwner ? "Titular" : `Participante ${index}`} error={errors[`expense-person-${index}`]}>
                    <input {...accessibility(`expense-person-${index}`)} type="text" value={p.name} readOnly={p.isOwner} required autoComplete="off" maxLength={120} placeholder="Nome" onChange={e => updateParticipant(index, { name: e.target.value })} />
                  </Field>
                  <Field id={`expense-share-${index}`} label={p.isOwner ? "Minha parte (R$)" : `Parte do participante ${index} (R$)`} error={errors[`expense-share-${index}`]}>
                    <input {...accessibility(`expense-share-${index}`)} type="text" inputMode="decimal" value={p.amount} required autoComplete="off" placeholder="0,00" onChange={e => updateParticipant(index, { amount: e.target.value })} />
                  </Field>
                  {!p.isOwner && <button type="button" className="expense-entry__remove" aria-label={`Remover participante ${index}`} onClick={() => change({ participants: draft.participants.filter((_, i) => i !== index) })}><Trash2 aria-hidden="true" /></button>}
                </div>
              ))}
            </div>
            <div className="expense-entry__sharing-footer">
              <Button type="button" variant="outline" className="expense-entry__action" onClick={() => {
                const id = `participant-${nextId.current++}`;
                change({ participants: [...draft.participants, { id, name: "", amount: "", isOwner: false }] });
              }}><Plus aria-hidden="true" />Adicionar pessoa</Button>
              <p className="expense-entry__help num" aria-live="polite">
                {remaining === null ? "Preencha os valores para conferir a divisão." : remaining === 0 ? "Divisão completa: valores conferem." : remaining > 0 ? `Falta distribuir ${formatBRL(remaining)}.` : `A divisão excede o total em ${formatBRL(-remaining)}.`}
              </p>
            </div>
            {errors["expense-shares"] && <p className="expense-entry__error">{errors["expense-shares"]}</p>}
          </section>
        )}

        <div className="expense-entry__actions">
          <Button asChild variant="outline" className="expense-entry__action"><Link to="/dashboard" search={true}>Voltar ao dashboard</Link></Button>
          <Button type="submit" className="expense-entry__action"><Check aria-hidden="true" />Conferir cadastro</Button>
        </div>
      </form>
      {reviewed && (
        <section ref={resultRef} tabIndex={-1} className="surface-card expense-entry__section expense-entry__review" aria-labelledby="expense-review-title" data-testid="expense-review">
          <h2 id="expense-review-title">Cadastro conferido</h2>
          <p role="status" className="expense-entry__intro">Os campos são consistentes. Nenhuma despesa foi salva; o dashboard e o saldo não foram alterados.</p>
          <dl className="expense-entry__summary">
            <div><dt>Motivo</dt><dd>{reviewed.description}</dd></div>
            <div><dt>Categoria</dt><dd>{categoryLabel(reviewed.category)}</dd></div>
            <div><dt>{reviewed.installments ? "Data original da compra" : "Data do gasto / cobrança"}</dt><dd>{dateLabel(reviewed.purchaseDate)}</dd></div>
            <div><dt>Pagamento</dt><dd>{reviewed.payment === "credito" ? "Cartão de crédito — demonstração" : reviewed.payment === "debito" ? "Débito" : "Pix"}</dd></div>
            <div><dt>Valor total</dt><dd className="num">{formatBRL(reviewed.amountCents)}</dd></div>
            <div><dt>Minha parte</dt><dd className="num">{formatBRL(reviewed.myShareCents)}</dd></div>
            {reviewed.invoice && <div><dt>Fatura inicial</dt><dd>{monthLabel(reviewed.invoice.month)}{reviewed.invoice.manuallySelected ? " · corrigida manualmente" : " · automática"}</dd></div>}
            <div><dt>Identificação</dt><dd>{[reviewed.recurringMonthly ? "Fixo / recorrente" : "", reviewed.installments ? `Parcelado ${reviewed.installments.current}/${reviewed.installments.count}` : "", reviewed.shared ? "Compartilhado" : ""].filter(Boolean).join(" · ") || "Avulso"}</dd></div>
            {reviewed.installments && <div><dt>Referência por parcela</dt><dd className="num"><InstallmentPreview value={reviewed.amountCents} count={reviewed.installments.count} /></dd></div>}
          </dl>
          {reviewed.shared && <ul className="expense-entry__review-shares">{reviewed.participants.map(p => <li key={p.id}><span>{p.isOwner ? "Minha parte" : p.name}</span><strong className="num">{formatBRL(p.amountCents)}</strong></li>)}</ul>}
          <p className="expense-entry__help">Alterar qualquer campo desfaz esta conferência para evitar um resumo desatualizado. Os dados ficam somente nesta tela e são descartados ao sair ou recarregar.</p>
        </section>
      )}
    </div>
  );
}
