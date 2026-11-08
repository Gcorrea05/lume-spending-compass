import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createLumeServer } from './serve-local.mjs';
let dir, server, base;
before(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(),'lume-server-test-'));
  await mkdir(path.join(dir,'assets'));
  await writeFile(path.join(dir,'_shell.html'),'<html lang="pt-BR">Lume</html>');
  await writeFile(path.join(dir,'assets','app.js'),'console.log("fixture");');
  await writeFile(path.join(dir,'.env'),'NEVER_SERVE=1');
  server = await createLumeServer(dir,'test-only');
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); await rm(dir,{recursive:true,force:true}); });
for (const route of ['/','/login','/dashboard','/gastos','/gastos/novo','/criar-conta','/recuperar-senha']) {
  test(`SPA fallback: ${route}`, async () => {
    const r = await fetch(base+route); assert.equal(r.status,200); assert.match(await r.text(),/Lume/);
  });
}
test('static asset MIME',async () => {const r=await fetch(base+'/assets/app.js');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/javascript/);});
test('refuses POST',async () => assert.equal((await fetch(base+'/login',{method:'POST'})).status,405));
test('refuses external Host',async () => {
  const status = await new Promise((resolve,reject) => {
    const req = http.get(base+'/login',{headers:{host:'attacker.invalid'}},res => {res.resume();resolve(res.statusCode);});
    req.on('error',reject);
  });
  assert.equal(status,403);
});
test('refuses dotfiles',async () => assert.equal((await fetch(base+'/.env')).status,400));
test('no invented API',async () => assert.equal((await fetch(base+'/api/gastos')).status,404));
test('health identifies this frontend',async () => {const r=await fetch(base+'/__lume_health');const body=await r.json();assert.equal(body.instance,'test-only');assert.equal(body.frontendOnly,true);});
test('HEAD without body',async () => {const r=await fetch(base+'/login',{method:'HEAD'});assert.equal(r.status,200);assert.equal(await r.text(),'');});
