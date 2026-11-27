import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '4173', 10);
const DIST_DIR = path.resolve(__dirname, 'dist');
const pidFile = path.resolve(__dirname, '.preview_server.pid');

try {
  fs.writeFileSync(pidFile, String(process.pid));
} catch {}

const cleanup = () => {
  try {
    if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  } catch {}
};
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });

if (!fs.existsSync(DIST_DIR)) {
  console.error(`[ERROR] Build directory not found: ${DIST_DIR}`);
  console.error(`Please run 'npm run build' first.`);
  process.exit(1);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Graceful shutdown endpoint
  if (req.url === '/__shutdown') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('SHUTTING_DOWN');
    setTimeout(() => {
      server.close(() => process.exit(0));
    }, 150);
    return;
  }

  // Sanitize requested URL path
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  
  // Prevent directory traversal
  let safePath = path.normalize(path.join(DIST_DIR, pathname));
  if (!safePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Check if file exists
  let targetFile = safePath;
  if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
    targetFile = path.join(targetFile, 'index.html');
  }

  // SPA fallback: if file does not exist or has no extension, fallback to index.html
  if (!fs.existsSync(targetFile) || !fs.statSync(targetFile).isFile()) {
    targetFile = path.join(DIST_DIR, 'index.html');
  }

  if (!fs.existsSync(targetFile)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(targetFile);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });

  const stream = fs.createReadStream(targetFile);
  stream.pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log('  Yoga Studio Management Portal - Production Server   ');
  console.log('======================================================');
  console.log(`  ➜ Local:   http://localhost:${PORT}/`);

  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  ➜ Network: http://${net.address}:${PORT}/`);
      }
    }
  }
  console.log('======================================================');
  console.log('Press Ctrl+C to terminate the server.\n');
});
