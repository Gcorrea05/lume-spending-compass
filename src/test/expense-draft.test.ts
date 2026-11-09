import { describe, it } from "vitest";
import * as assert from "node:assert/strict";
import { createExpenseDraft, expenseInvoice, isExpenseDate, parseExpenseMoney, reviewExpenseDraft, suggestExpenseInvoice } from "@/lib/expense-draft";
import type { ExpenseDraft } from "@/types/expense-draft";

const valid = (): ExpenseDraft => ({ ...createExpenseDraft(), description: "Mercado", amount: "150,00", date: "2026-11-10", category: "alimentacao", payment: "pix" });
const shared = (): ExpenseDraft => ({ ...valid(), amount: "1.200,00", shared: true, participants: [
  { id: "owner", name: "Minha parte", amount: "200,00", isOwner: true },
  { id: "p1", name: "Sofia", amount: "400,00", isOwner: false },
  { id: "p2", name: "Pasquale", amount: "600,00", isOwner: false },
] });

describe("expense entry: exact money and dates", () => {
  it("parses Brazilian amounts into exact integer cents", () => {
    assert.equal(parseExpenseMoney("1.200,00"), 120000);
    assert.equal(parseExpenseMoney("1200"), 120000);
    assert.equal(parseExpenseMoney(" 0,01 "), 1);
    assert.equal(parseExpenseMoney("12,5"), 1250);
    assert.equal(parseExpenseMoney("1.234.567,89"), 123456789);
  });
  it("rejects empty, negative and non-finite values", () => {
    for (const value of ["", " ", "-1,00", "NaN", "Infinity", "1e3", "R$ 10,00"]) assert.equal(parseExpenseMoney(value), null, value);
  });
  it("does not silently reinterpret dot decimal or malformed groups", () => {
    for (const value of ["1200.50", "1.20,00", "1,234", "1.234.5", "12,", ",50"]) assert.equal(parseExpenseMoney(value), null, value);
  });
  it("rejects cents outside the safe integer range", () => assert.equal(parseExpenseMoney("999999999999999999999,99"), null));
  it("validates Gregorian dates including leap years", () => {
    assert.ok(isExpenseDate("2024-02-29")); assert.ok(isExpenseDate("2000-02-29"));
    for (const d of ["2026-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "0000-01-01", "10/11/2026", ""]) assert.equal(isExpenseDate(d), false, d);
  });
  it("closing day 27 starts the next invoice", () => {
    assert.equal(suggestExpenseInvoice("2026-11-26"), "2026-11");
    assert.equal(suggestExpenseInvoice("2026-11-27"), "2026-12");
    assert.equal(suggestExpenseInvoice("2026-11-28"), "2026-12");
  });
  it("handles invoice year rollover", () => assert.equal(suggestExpenseInvoice("2026-12-27"), "2027-01"));
  it("supports a different closing day without changing the default", () => {
    assert.equal(suggestExpenseInvoice("2026-11-09", 10), "2026-11");
    assert.equal(suggestExpenseInvoice("2026-11-10", 10), "2026-12");
  });
  it("does not create an invoice from invalid dates", () => {
    assert.equal(suggestExpenseInvoice("2026-02-31"), "");
    assert.equal(suggestExpenseInvoice("2026-11-10", 0), "");
    assert.equal(suggestExpenseInvoice("9999-12-31"), "");
  });
});

describe("expense entry: form review contract", () => {
  it("starts blank without inventing a date or payment", () => {
    const d = createExpenseDraft(); assert.equal(d.date, ""); assert.equal(d.payment, ""); assert.equal(d.shared, false);
  });
  it("reports required fields on an empty form", () => {
    const r = reviewExpenseDraft(createExpenseDraft()); assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["expense-description", "expense-amount", "expense-date", "expense-category", "expense-payment"].sort());
  });
  it("reviews an ordinary expense without storage side effects", () => {
    const d = valid(), before = JSON.stringify(d), r = reviewExpenseDraft(d);
    assert.ok(r.ok); if (r.ok) { assert.equal(r.value.amountCents, 15000); assert.equal(r.value.myShareCents, 15000); assert.equal(r.value.invoice, null); }
    assert.equal(JSON.stringify(d), before);
  });
  it("rejects zero expense total", () => assert.equal(reviewExpenseDraft({ ...valid(), amount: "0,00" }).ok, false));
  it("trims description and rejects blank names", () => {
    const r = reviewExpenseDraft({ ...valid(), description: " Mercado  " });
    assert.ok(r.ok); if (r.ok) assert.equal(r.value.description, "Mercado");
    assert.equal(reviewExpenseDraft({ ...valid(), description: " " }).ok, false);
  });
  it("calculates a suggested invoice and preserves original date", () => {
    const r = reviewExpenseDraft({ ...valid(), date: "2026-11-27", payment: "credito" });
    assert.ok(r.ok); if (r.ok) { assert.equal(r.value.invoice?.month, "2026-12"); assert.equal(r.value.purchaseDate, "2026-11-27"); }
  });
  it("manual invoice supersedes suggestion without rewriting purchase date", () => {
    const d = { ...valid(), payment: "credito", invoiceManual: true, invoiceMonth: "2027-01" } as ExpenseDraft;
    assert.equal(expenseInvoice(d), "2027-01");
    const r = reviewExpenseDraft(d); assert.ok(r.ok);
    if (r.ok) { assert.equal(r.value.invoice?.manuallySelected, true); assert.equal(r.value.purchaseDate, "2026-11-10"); }
  });
  it("rejects invalid manual invoice instead of silently replacing it", () => {
    assert.equal(reviewExpenseDraft({ ...valid(), payment: "credito", invoiceManual: true, invoiceMonth: "2026-13" }).ok, false);
  });
  it("discards credit-only fields from a debit review", () => {
    const r = reviewExpenseDraft({ ...valid(), payment: "debito", invoiceManual: true, invoiceMonth: "bad" });
    assert.ok(r.ok); if (r.ok) assert.equal(r.value.invoice, null);
  });
  it("records recurrence without generating transactions", () => {
    const r = reviewExpenseDraft({ ...valid(), recurring: true }); assert.ok(r.ok);
    if (r.ok) { assert.equal(r.value.recurringMonthly, true); assert.equal("occurrences" in r.value, false); }
  });
  it("accepts an installment plan and preserves total purchase", () => {
    const r = reviewExpenseDraft({ ...valid(), amount: "1200,00", installment: true, installmentCount: 6, currentInstallment: 2 });
    assert.ok(r.ok); if (r.ok) { assert.equal(r.value.amountCents, 120000); assert.deepEqual(r.value.installments, { count: 6, current: 2 }); }
  });
  it("rejects current installment outside its plan", () => {
    assert.equal(reviewExpenseDraft({ ...valid(), installment: true, installmentCount: 6, currentInstallment: 7 }).ok, false);
    assert.equal(reviewExpenseDraft({ ...valid(), installment: true, currentInstallment: 0 }).ok, false);
  });
  it("rejects fractional or out-of-range installment counts", () => {
    for (const n of [0, 1.5, 13]) assert.equal(reviewExpenseDraft({ ...valid(), installment: true, installmentCount: n }).ok, false);
  });
  it("does not turn stale hidden installment fields into active data", () => {
    const r = reviewExpenseDraft({ ...valid(), installment: false, installmentCount: 0 }); assert.ok(r.ok); if (r.ok) assert.equal(r.value.installments, null);
  });
  it("validates the PDF shared example 200 + 400 + 600", () => {
    const r = reviewExpenseDraft(shared()); assert.ok(r.ok);
    if (r.ok) { assert.equal(r.value.amountCents, 120000); assert.equal(r.value.myShareCents, 20000); assert.equal(r.value.participants.length, 3); }
  });
  it("rejects both incomplete and excessive allocations", () => {
    for (const amount of ["399,00", "401,00"]) { const d = shared(); d.participants[1]!.amount = amount; assert.equal(reviewExpenseDraft(d).ok, false); }
  });
  it("requires a participant name and a value", () => {
    const d = shared(); d.participants[1]!.name = " "; d.participants[1]!.amount = "";
    const r = reviewExpenseDraft(d); assert.equal(r.ok, false);
    if (!r.ok) { assert.ok(r.errors["expense-person-1"]); assert.ok(r.errors["expense-share-1"]); }
  });
  it("requires exactly one owner and another participant", () => {
    const d = shared(); d.participants = [{ id: "only", name: "Owner", amount: "1200", isOwner: true }];
    assert.equal(reviewExpenseDraft(d).ok, false);
    const d2 = shared(); d2.participants[1]!.isOwner = true; assert.equal(reviewExpenseDraft(d2).ok, false);
  });
  it("allows a zero share without confusing it with a blank field", () => {
    const d = shared(); d.participants[0]!.amount = "0,00"; d.participants[1]!.amount = "600,00";
    const r = reviewExpenseDraft(d); assert.ok(r.ok); if (r.ok) assert.equal(r.value.myShareCents, 0);
  });
  it("supports shared installments in the same form", () => {
    const r = reviewExpenseDraft({ ...shared(), installment: true, installmentCount: 6, currentInstallment: 2 });
    assert.ok(r.ok); if (r.ok) { assert.equal(r.value.shared, true); assert.equal(r.value.installments?.current, 2); }
  });
  it("does not invent rounding, reimbursements, payments or balances", () => {
    const r = reviewExpenseDraft({ ...valid(), amount: "100,00", installment: true, installmentCount: 3 });
    assert.ok(r.ok); if (r.ok) {
      assert.equal(r.value.amountCents, 10000);
      for (const key of ["balance", "transactions", "reimbursements", "paid", "schedule"]) assert.equal(key in r.value, false);
    }
  });
  it("does not share mutable participant arrays between new forms", () => {
    const a = createExpenseDraft(), b = createExpenseDraft(); a.participants[0]!.amount = "999"; assert.equal(b.participants[0]!.amount, "");
  });
});
