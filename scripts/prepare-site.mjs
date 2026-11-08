import { access, mkdir, cp, writeFile } from 'node:fs/promises';
import path from 'node:path';
const candidates = ['.output/public','dist/client'];
let source;
for (const p of candidates) {
  try { await access(path.join(p,'_shell.html')); source = p; break; } catch { /* try next known output */ }
}
if (!source) throw new Error('Build SPA incompleto: _shell.html nao foi gerado. A instalacao nao sera ativada.');
const target = process.argv[2];
if (!target) throw new Error('Informe o destino dos arquivos estaticos.');
await mkdir(target,{recursive:true});
await cp(source,target,{recursive:true,filter:p => !p.endsWith('.map')});
await writeFile(path.join(target,'lume-version.json'),JSON.stringify({version:'0.1.1-frontend',frontendOnly:true},null,2));
console.log(`Frontend estatico preparado: ${source} -> ${target}`);
