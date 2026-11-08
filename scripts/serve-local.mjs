/** Serves compiled frontend files on loopback. No financial API or persistence. */
import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff'};
const APP_ROUTES = new Set(['/','/login','/dashboard','/gastos','/gastos/novo','/criar-conta','/recuperar-senha']);
export async function createLumeServer(siteDirectory, instance = 'standalone') {
  const root = await realpath(path.resolve(siteDirectory));
  const shellPath = await realpath(path.join(root, '_shell.html'));
  if (!shellPath.startsWith(root + path.sep)) throw new Error('Shell fora do diretorio do frontend.');
  const server = http.createServer(async (req, res) => {
    const allowedHosts = new Set([`127.0.0.1:${server.address()?.port}`, `localhost:${server.address()?.port}`]);
    if (!allowedHosts.has(req.headers.host?.toLowerCase())) { res.writeHead(403); return res.end('Host nao permitido'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, {'Allow':'GET, HEAD'}); return res.end(); }
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Cache-Control','no-store');
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(p => p.startsWith('.'))) {
        res.writeHead(400); return res.end('Caminho invalido');
      }
      if (pathname === '/__lume_health') {
        res.setHeader('Content-Type', MIME['.json']);
        return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({application:'lume',version:'0.1.1-frontend',frontendOnly:true,instance}));
      }
      let requested;
      if (APP_ROUTES.has(pathname.replace(/\/$/, '') || '/')) requested = shellPath;
      else {
        requested = await realpath(path.resolve(root, '.' + pathname));
        if (!requested.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
      }
      if (!(await stat(requested)).isFile()) { res.writeHead(404); return res.end(); }
      res.setHeader('Content-Type', MIME[path.extname(requested).toLowerCase()] ?? 'application/octet-stream');
      const bytes = await readFile(requested);
      res.setHeader('Content-Length', bytes.length);
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      if (error instanceof URIError) { res.writeHead(400); return res.end('URL invalida'); }
      if (['ENOENT','ENOTDIR'].includes(error?.code)) { res.writeHead(404); return res.end('Nao encontrado'); }
      res.writeHead(500); res.end('Falha ao ler o frontend.');
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const site = process.argv[2];
  const port = Number(process.argv[3] ?? 17842);
  const instance = process.argv[4] ?? 'standalone';
  if (!site || !Number.isInteger(port) || port < 1024 || port > 65535) {
    console.error('Uso: node serve-local.mjs <site> [porta 17842] [instancia]'); process.exit(1);
  }
  const server = await createLumeServer(site, instance);
  server.on('error', err => { console.error(err.message); process.exitCode = 1; });
  server.listen(port,'127.0.0.1',() => console.log(`Lume frontend: http://127.0.0.1:${port}/login`));
  for (const sig of ['SIGINT','SIGTERM']) process.on(sig,() => server.close(() => process.exit(0)));
}
