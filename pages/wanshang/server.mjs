import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { renderPage } from './render.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3780;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function isInsideRoot(filePath) {
  const rel = relative(DIR, filePath);
  return rel !== '' && !rel.startsWith('..') && !rel.startsWith(`..${sep}`);
}

async function sendFile(res, filePath) {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }
  const body = await readFile(filePath);
  res.writeHead(200, {
    'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=3600'
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/' || pathname === '/wanshang' || pathname === '/wanshang.html' || pathname === '/index.html') {
      const html = await renderPage();
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(html);
      return;
    }

    const filePath = normalize(join(DIR, pathname.replace(/^\/+/, '')));
    if (!isInsideRoot(filePath) && filePath !== DIR) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    await sendFile(res, filePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`挽商页 SSR 已启动: http://localhost:${PORT}/`);
});
