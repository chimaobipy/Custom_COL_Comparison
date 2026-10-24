import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv.includes('--dist') ? 'dist' : '.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Invalid URL'); return; }
  if (pathname === '/') pathname = '/index.html';
  if (pathname !== '/index.html' && !pathname.startsWith('/src/') && !pathname.startsWith('/data/')) { res.writeHead(404).end('Not found'); return; }
  const path = resolve(root, '.' + pathname);
  if (path !== resolve(root, 'index.html') && !path.startsWith(resolve(root, 'src') + sep) && !path.startsWith(resolve(root, 'data') + sep)) { res.writeHead(403).end(); return; }
  try { const content = await readFile(path); res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(content); }
  catch { res.writeHead(404).end('Not found'); }
});
server.listen(5173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:5173'));
