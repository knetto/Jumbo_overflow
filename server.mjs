import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createLocalDb } from './scripts/local-db.mjs';
import { handleApi } from './worker/api.js';

const root = path.resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const db = createLocalDb(fileURLToPath(new URL('./.data/jumbooverflow.sqlite',import.meta.url)));
const port = Number(process.env.PORT || 4173); // Override PORT for a second local preview.
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
export const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const existingUser = req.headers.cookie?.match(/(?:^|;\s*)jo-local-user=([a-z0-9-]{36})/)?.[1];
    const localUser = existingUser || crypto.randomUUID();
    if(!existingUser)res.setHeader('Set-Cookie',`jo-local-user=${localUser}; Path=/; HttpOnly; SameSite=Lax`);
    if(url.pathname.startsWith('/api/')){
      const chunks=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>150000){res.writeHead(413).end('Te groot');return;}chunks.push(chunk);}
      const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id',`local-${localUser}`);
      const proto=(req.headers['x-forwarded-proto']||(req.headers.origin?.startsWith('https://')?'https':'http')).split(',')[0].trim();
      const host=(req.headers['x-forwarded-host']||req.headers.host||'localhost').split(',')[0].trim();
      const request=new Request(`${proto}://${host}${req.url}`,{method:req.method,headers,body:!['GET','HEAD'].includes(req.method)?Buffer.concat(chunks):undefined});
      const response=await handleApi(request,{DB:db});
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep) && target !== path.join(root, 'index.html')) {
      res.writeHead(403).end(); return;
    }
    const content = await readFile(target);
    const immutable = target.endsWith('.woff2');
    const cache = immutable ? 'public, max-age=31536000, immutable' : 'no-store, no-cache, must-revalidate';
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': cache, 'CDN-Cache-Control': cache, 'Cloudflare-CDN-Cache-Control': cache });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Niet gevonden');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`JumboOverflow is klaar op http://localhost:${port}`));
