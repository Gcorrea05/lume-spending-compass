/** Actual application browser checks. Requires a built SPA and Playwright Chromium. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createLumeServer } from '../scripts/serve-local.mjs';

const site = process.argv[2];
const output = path.resolve(process.argv[3] || 'qa-results');
if (!site) throw new Error('Usage: node qa/frontend.mjs <compiled-site> [report-directory]');
await fs.mkdir(output, { recursive: true });
const server = await createLumeServer(site, 'browser-validation');
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const results = [];
let browser;
let page;
const errors = [];
const noOverflow = async page => {
  const box = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  if (box.document > box.viewport + 1 || box.body > box.viewport + 1) {
    const overflowing = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      return [...document.querySelectorAll('body *')].flatMap(el => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (!r.width || !r.height || cs.visibility === 'hidden' || cs.position === 'fixed') return [];
        if (r.right <= viewport + 1 && r.left >= -1) return [];
        return [{ tag: el.tagName, id: el.id, className: String(el.className).slice(0, 200),
          x: r.x, right: r.right, width: r.width, whiteSpace: cs.whiteSpace }];
      }).slice(0, 12);
    });
    assert.fail(JSON.stringify({ ...box, overflowing }));
  }
};
const step = async (name, fn) => {
  try { await fn(); results.push({ name, status: 'passed' }); console.log(`PASS ${name}`); }
  catch (error) {
    const failure = { name, status: 'failed', error: String(error.stack || error) };
    if (page && !page.isClosed()) {
      const file = `FAIL-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
      try { await page.screenshot({ path: path.join(output, file), fullPage: true }); failure.screenshot = file; }
      catch { /* Keep the original assertion failure if screenshot capture also fails. */ }
    }
    results.push(failure);
    console.error(`FAIL ${name}: ${error.message}`);
  }
};
const settle = page => page.waitForTimeout(350);
// A visible element can still be shrinking/growing during an opening animation.
// trial performs normal Playwright actionability/stability checks without clicking.
// The original 43.5px tolerance is retained; an undersized stable control still fails.
const assertCloseTarget = async close => {
  await close.click({ trial: true });
  const bounds = await close.boundingBox();
  const css = await close.evaluate(el => {
    const style = getComputedStyle(el);
    return { width: style.width, height: style.height, fontSize: style.fontSize };
  });
  assert.ok(bounds && bounds.width >= 43.5 && bounds.height >= 43.5,
    JSON.stringify({ expectedMinimum: 43.5, bounds, css }));
};

const atDemo = async page => {
  await page.goto(`${base}/login`);
  await page.getByRole('button', { name: 'Explorar demonstração' }).click();
  await page.waitForURL('**/dashboard*');
  await page.getByRole('heading', { name: 'Últimos gastos' }).waitFor();
  await settle(page);
};

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const widths = [360, 390, 768, 1024, 1279, 1280, 1920];
  for (const theme of ['dark', 'light']) {
    for (const width of widths) {
      await step(`layout-${theme}-${width}`, async () => {
        await page.setViewportSize({ width, height: width < 500 ? 844 : 1080 });
        await atDemo(page);
        await page.evaluate(theme => document.documentElement.classList.toggle('dark', theme === 'dark'), theme);
        await settle(page);
        await noOverflow(page);
        const table = await page.getByTestId('expense-table').isVisible();
        const cards = await page.getByTestId('expense-cards').isVisible();
        assert.notEqual(table, cards, 'Exactly one representation must be visible.');
        if (width < 1280) assert.ok(cards, 'Below 1280px use cards.');
        if (width === 1920) assert.ok(table, '1920px must show desktop table.');
        await page.screenshot({ path: path.join(output, `dashboard-${theme}-${width}.png`), fullPage: true });
      });
    }
  }
  await step('dialog-close-target-focus-and-escape', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await atDemo(page);
    await page.getByRole('button', { name: 'Ajustar saldo', exact: true }).click();
    const close = page.getByRole('button', { name: 'Fechar janela', exact: true });
    await close.waitFor();
    await assertCloseTarget(close);
    await close.click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(await page.getByRole('button', { name: 'Ajustar saldo', exact: true }).evaluate(e => e === document.activeElement), true);
    await page.getByRole('button', { name: 'Ajustar saldo', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
  });
  await step('small-visible-viewport-keyboard-proxy', async () => {
    await page.setViewportSize({ width: 390, height: 350 });
    await atDemo(page);
    await page.getByRole('button', { name: 'Ajustar saldo', exact: true }).click();
    await page.getByLabel('Novo saldo').focus();
    await settle(page);
    const box = await page.getByRole('dialog').boundingBox();
    assert.ok(box && box.y >= -1 && box.y + box.height <= 351, JSON.stringify(box));
    await noOverflow(page);
    await page.getByRole('button', { name: 'Salvar', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, 'short-viewport-dialog.png'), fullPage: true });
    await page.getByRole('button', { name: 'Fechar janela' }).click();
  });
  await step('text-enlargement-200-percent-dashboard', async () => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await atDemo(page);
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    await settle(page);
    await noOverflow(page);
    await page.screenshot({ path: path.join(output, 'dashboard-text-200.png'), fullPage: true });
    await page.evaluate(() => document.documentElement.style.fontSize = '');
  });
  await step('menu-close-target-and-focus', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await atDemo(page);
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    const close = page.getByRole('button', { name: 'Fechar menu', exact: true });
    await assertCloseTarget(close);
    await close.click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(await page.getByRole('button', { name: 'Abrir menu', exact: true }).evaluate(e => e === document.activeElement), true);
  });
  await step('period-navigation-preserves-filters', async () => {
    await atDemo(page);
    await page.getByRole('button', { name: 'Últimos 30 dias', exact: true }).click();
    await page.getByRole('link', { name: 'Ver todos', exact: true }).click();
    await page.waitForURL('**/gastos?*');
    assert.ok(new URL(page.url()).searchParams.get('dias') === '30');
    await page.goBack();
    await page.waitForURL('**/dashboard?*');
    assert.ok(new URL(page.url()).searchParams.get('dias') === '30');
  });
  for (const route of ['/login', '/criar-conta', '/recuperar-senha']) {
    await step(`access-short-viewport-${route.slice(1)}`, async () => {
      await page.setViewportSize({ width: 360, height: 350 });
      await page.goto(base + route);
      await settle(page);
      await noOverflow(page);
      const last = page.locator('form button[type="submit"]').last();
      if (await last.count()) {
        await last.scrollIntoViewIfNeeded();
        const box = await last.boundingBox();
        assert.ok(box && box.y >= 0 && box.y < 350, 'Submit must be scroll-reachable.');
      }
      await page.screenshot({ path: path.join(output, `${route.slice(1)}-short.png`), fullPage: true });
    });
  }
  for (const route of ['/login', '/criar-conta', '/recuperar-senha']) {
    await step(`${route.slice(1)}-text-enlargement-200-percent`, async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + route);
      await page.evaluate(() => document.documentElement.style.fontSize = '200%');
      try {
        await settle(page);
        await noOverflow(page);
        const actions = page.locator('main form button[type="submit"], main a.press, main button:not([aria-label])');
        for (const action of await actions.all()) {
          if (!(await action.isVisible())) continue;
          await action.scrollIntoViewIfNeeded();
          const b = await action.boundingBox();
          assert.ok(b && b.x >= -1 && b.x + b.width <= 391, JSON.stringify(b));
          assert.equal(await action.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true,
            'Action text must fit its own control, not just the page.');
        }
        await page.screenshot({ path: path.join(output, `${route.slice(1)}-text-200.png`), fullPage: true });
      } finally {
        await page.evaluate(() => document.documentElement.style.fontSize = '');
      }
    });
  }
  await step('reduced-motion-usable', async () => {
    const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    const p = await reduced.newPage();
    await atDemo(p);
    await noOverflow(p);
    await reduced.close();
  });
  await step('no-browser-runtime-errors', async () => assert.deepEqual([...new Set(errors)], []));
  await context.close();
} catch (error) {
  results.push({ name: 'browser-harness', status: 'failed', error: String(error.stack || error) });
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  const report = {
    version: '0.1.1-frontend-hotfix3', checkedAt: new Date().toISOString(),
    limitations: ['Short viewport is a keyboard proxy, not a physical device keyboard test.', '200% root font sizing is not a native browser zoom test.', 'Automated geometry and screenshots do not replace human visual approval.'],
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length, results,
  };
  await fs.writeFile(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed }));
  if (report.failed) process.exitCode = 1;
}
