import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const port = Number(process.env.PORT || 4173);

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'POST' && url.pathname === '/__qa/report') {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 250_000) throw new Error('Report too large');
      }
      const report = JSON.parse(body);
      await mkdir(path.join(root, '.qa'), { recursive: true });
      await writeFile(path.join(root, '.qa', 'report.json'), JSON.stringify(report, null, 2));
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"saved":true}');
      return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405).end();
      return;
    }
    const pathname = url.pathname === '/__qa' ? '/scripts/preview.html' : url.pathname;
    // The prefix also checks GitHub Pages-style deployment below a repository path.
    const relative = decodeURIComponent(pathname.replace(/^\/medipr\//, '/')).replace(/^\/+/, '') || 'index.html';
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep) || relative.split(/[\\/]/).some((part) => part.startsWith('.'))) {
      response.writeHead(403).end();
      return;
    }
    const data = await readFile(filename);
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 400, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
