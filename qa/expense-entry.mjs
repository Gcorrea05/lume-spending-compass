/** Real application tests for the new entry screen; all data stays in memory. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createLumeServer } from '../scripts/serve-local.mjs';
const site = process.argv[2], output = path.resolve(process.argv[3] || 'qa-expense-entry');
if (!site) throw new Error('Usage: node qa/expense-entry.mjs <compiled-site> [report-directory]');
await fs.mkdir(output, { recursive: true });
const server = await createLumeServer(site, 'expense-entry-validation');
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const results = [], errors = [];
let browser, page;
async function step(name, fn) {
  try { await fn(); results.push({ name, status: 'passed' }); console.log(`PASS ${name}`); }
  catch (error) {
    const item = { name, status: 'failed', error: String(error.stack || error) };
    try { item.screenshot = `FAIL-${name}.png`; await page.screenshot({ path: path.join(output, item.screenshot), fullPage: true }); } catch { /* Original error remains available. */ }
    results.push(item); console.error(`FAIL ${name}: ${error.message}`);
  }
}
async function atForm() {
  await page.goto(base + '/login');
  await page.getByRole('button', { name: 'Explorar demonstração', exact: true }).click();
  await page.waitForURL('**/dashboard*');
  await page.locator('main').getByRole('link', { name: 'Cadastrar gasto', exact: true }).click();
  await page.getByRole('heading', { name: 'Dados do gasto', exact: true }).waitFor();
}
async function basic() {
  await page.locator('#expense-description').fill('Mercado de teste');
  await page.locator('#expense-amount').fill('150,00');
  await page.locator('#expense-date').fill('2026-11-10');
  await page.locator('#expense-category').selectOption('alimentacao');
  await page.locator('#expense-payment').selectOption('pix');
}
async function submit() {
  await page.getByRole('button', { name: 'Conferir cadastro', exact: true }).click();
}
async function shareExample() {
  await basic(); await page.locator('#expense-amount').fill('1.200,00');
  await page.locator('#expense-shared').check();
  await page.locator('#expense-share-0').fill('200,00');
  await page.locator('#expense-person-1').fill('Sofia');
  await page.locator('#expense-share-1').fill('400,00');
  await page.getByRole('button', { name: 'Adicionar pessoa', exact: true }).click();
  await page.locator('#expense-person-2').fill('Pasquale');
  await page.locator('#expense-share-2').fill('600,00');
}
async function noOverflow() {
  const b = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return { viewport: w, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
      outside: [...document.querySelectorAll('.expense-entry input, .expense-entry select, .expense-entry button')].flatMap(el => {
        const r = el.getBoundingClientRect();
        return r.width && (r.right > w + 1 || r.left < -1) ? [{ id: el.id, right: r.right, left: r.left }] : [];
      }) };
  });
  assert.ok(b.document <= b.viewport + 1 && b.body <= b.viewport + 1 && b.outside.length === 0, JSON.stringify(b));
}
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' });
  page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  for (const theme of ['dark', 'light']) {
    for (const width of [360, 390, 768, 1279, 1920]) {
      await step(`entry-layout-${theme}-${width}`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await atForm(); await shareExample();
        await page.locator('#expense-installment').check();
        await page.locator('#expense-installments').selectOption('6');
        await page.locator('#expense-current-installment').selectOption('2');
        await page.evaluate(t => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
        await noOverflow();
        await page.screenshot({ path: path.join(output, `entry-${theme}-${width}.png`), fullPage: true });
      });
    }
  }
  await step('required-fields-and-focus', async () => {
    await atForm(); await submit();
    await page.waitForFunction(() => document.activeElement?.id === 'expense-description');
    assert.equal(await page.getByTestId('expense-review').count(), 0);
    assert.equal(await page.locator('[aria-invalid="true"]').count(), 5);
  });
  await step('ordinary-expense-review-no-fake-save', async () => {
    await atForm(); await basic(); await submit();
    await page.getByTestId('expense-review').waitFor();
    assert.match(await page.getByTestId('expense-review').innerText(), /Nenhuma despesa foi salva/);
    assert.match(await page.getByTestId('expense-review').innerText(), /150,00/);
  });
  await step('editing-clears-obsolete-review', async () => {
    await page.locator('#expense-amount').fill('180,00');
    await page.getByTestId('expense-review').waitFor({ state: 'hidden' });
  });
  await step('shared-example-and-difference-block', async () => {
    await atForm(); await shareExample();
    await page.locator('#expense-share-2').fill('599,00'); await submit();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByTestId('expense-review').count(), 0);
    await page.locator('#expense-share-2').fill('600,00'); await submit();
    await page.getByTestId('expense-review').waitFor();
    const text = await page.getByTestId('expense-review').innerText();
    assert.match(text, /1\.200,00/); assert.match(text, /200,00/); assert.match(text, /Sofia/); assert.match(text, /Pasquale/);
  });
  await step('installment-count-and-current', async () => {
    await atForm(); await basic();
    await page.locator('#expense-amount').fill('1200,00');
    await page.locator('#expense-installment').check();
    await page.locator('#expense-installments').selectOption('6');
    await page.locator('#expense-current-installment').selectOption('2'); await submit();
    await page.getByTestId('expense-review').waitFor();
    assert.match(await page.getByTestId('expense-review').innerText(), /Parcelado 2\/6/);
    assert.equal(await page.locator('#expense-current-installment option').count(), 6);
    await page.locator('#expense-installments').selectOption('1');
    assert.equal(await page.locator('#expense-current-installment').inputValue(), '1');
  });
  await step('card-closing-and-manual-invoice', async () => {
    await atForm(); await basic();
    await page.locator('#expense-date').fill('2026-11-27');
    await page.locator('#expense-payment').selectOption('credito');
    assert.equal(await page.locator('#expense-invoice').inputValue(), '2026-12');
    await page.locator('#expense-invoice').fill('2027-01'); await submit();
    await page.getByTestId('expense-review').waitFor();
    assert.match(await page.getByTestId('expense-review').innerText(), /01\/2027/);
    assert.match(await page.getByTestId('expense-review').innerText(), /27\/11\/2026/);
    await page.getByRole('button', { name: 'Usar fatura automática', exact: true }).click();
    assert.equal(await page.locator('#expense-invoice').inputValue(), '2026-12');
  });
  await step('recurring-and-participant-remove', async () => {
    await atForm(); await shareExample(); await page.locator('#expense-recurring').check();
    await page.getByRole('button', { name: 'Remover participante 2', exact: true }).click();
    await page.locator('#expense-share-1').fill('1000,00'); await submit();
    await page.getByTestId('expense-review').waitFor();
    assert.match(await page.getByTestId('expense-review').innerText(), /Fixo \/ recorrente/);
  });
  for (const width of [360, 390, 768]) {
    await step(`entry-text-200-${width}`, async () => {
      await page.setViewportSize({ width, height: 844 }); await atForm(); await shareExample();
      await page.locator('#expense-installment').check();
      await page.evaluate(() => document.documentElement.style.fontSize = '200%');
      try { await noOverflow(); await page.screenshot({ path: path.join(output, `entry-text-200-${width}.png`), fullPage: true }); }
      finally { await page.evaluate(() => document.documentElement.style.fontSize = ''); }
    });
  }
  await step('entry-short-visible-viewport', async () => {
    await page.setViewportSize({ width: 390, height: 350 }); await atForm(); await basic();
    const action = page.getByRole('button', { name: 'Conferir cadastro', exact: true });
    await action.scrollIntoViewIfNeeded(); const box = await action.boundingBox();
    assert.ok(box && box.y >= -1 && box.y + box.height <= 351, JSON.stringify(box)); await noOverflow();
  });
  await step('return-preserves-filters-and-leaves-dashboard-unchanged', async () => {
    await page.setViewportSize({ width: 1280, height: 900 }); await atForm();
    await page.getByRole('link', { name: 'Voltar ao dashboard', exact: true }).click();
    await page.waitForURL('**/dashboard*');
    await page.getByRole('button', { name: 'Últimos 30 dias', exact: true }).click();
    await page.locator('main').getByRole('link', { name: 'Cadastrar gasto', exact: true }).click();
    await basic(); await submit(); await page.getByTestId('expense-review').waitFor();
    await page.getByRole('link', { name: 'Voltar ao dashboard', exact: true }).click();
    await page.waitForURL('**/dashboard?*'); assert.equal(new URL(page.url()).searchParams.get('dias'), '30');
    const balance = page.locator('section[aria-labelledby="saldo-titulo"]');
    assert.match(await balance.innerText(), /1\.200,00/);
  });
  await step('entry-not-persisted', async () => {
    await atForm(); await basic(); await submit(); await page.getByTestId('expense-review').waitFor();
    await page.reload(); await page.locator('#expense-description').waitFor();
    assert.equal(await page.locator('#expense-description').inputValue(), '');
    assert.equal(await page.getByTestId('expense-review').count(), 0);
  });
  await step('no-entry-browser-runtime-errors', async () => assert.deepEqual([...new Set(errors)], []));
  await context.close();
} catch (error) { results.push({ name: 'entry-browser-harness', status: 'failed', error: String(error.stack || error) }); }
finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
  const report = { version: '0.2.0-frontend-cadastro', checkedAt: new Date().toISOString(),
    passed: results.filter(r => r.status === 'passed').length, failed: results.filter(r => r.status === 'failed').length,
    limitations: ['Short viewport is a keyboard proxy, not a physical keyboard test.', '200% font size is not every browser zoom mode.', 'Frontend review only; no database writes.'], results };
  await fs.writeFile(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed })); if (report.failed) process.exitCode = 1;
}
