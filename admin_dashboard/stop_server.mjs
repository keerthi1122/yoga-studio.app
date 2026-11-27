import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const systemRoot = process.env.SystemRoot || 'C:\\Windows';
const taskkillExe = path.join(systemRoot, 'System32', 'taskkill.exe');
const powershellExe = path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

// Ensure PATH includes system tools
process.env.PATH = [
  path.join(systemRoot, 'System32'),
  systemRoot,
  path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0'),
  process.env.PATH || ''
].join(';');

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function isPortOpen(port) {
  return new Promise(resolve => {
    const s = net.createConnection({ port, host: '127.0.0.1' }, () => {
      s.destroy();
      resolve(true);
    });
    s.setTimeout(300);
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.on('error', () => resolve(false));
  });
}

async function triggerShutdown(url, isHttps = false) {
  return new Promise((resolve) => {
    const client = isHttps ? https : http;
    const req = client.get(url, { rejectUnauthorized: false, timeout: 1500 }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  console.log('[INFO] Stopping any active Yoga Studio servers...');

  // 1. Try graceful HTTP/HTTPS shutdown endpoints
  const devShutdown = await triggerShutdown('https://localhost:5173/__shutdown', true);
  if (devShutdown) {
    console.log('[INFO] Successfully notified Dev Server (port 5173) to shut down.');
  }

  const previewShutdown = await triggerShutdown('http://localhost:4173/__shutdown', false);
  if (previewShutdown) {
    console.log('[INFO] Successfully notified Preview Server (port 4173) to shut down.');
  }

  // 2. Wait up to 1200ms for graceful shutdown to release ports cleanly
  let allClosed = false;
  for (let i = 0; i < 12; i++) {
    await wait(100);
    const p5173 = await isPortOpen(5173);
    const p4173 = await isPortOpen(4173);
    if (!p5173 && !p4173) {
      allClosed = true;
      break;
    }
  }

  // 3. Process PID files if any ports linger or files exist
  const pidFiles = [
    path.resolve(__dirname, '.server.pid'),
    path.resolve(__dirname, '.preview_server.pid'),
  ];

  for (const pidFile of pidFiles) {
    if (fs.existsSync(pidFile)) {
      try {
        const content = fs.readFileSync(pidFile, 'utf8');
        const pids = content.split(/\r?\n/).map(s => parseInt(s.trim(), 10)).filter(Boolean);

        if (!allClosed) {
          for (const pid of pids) {
            try {
              if (fs.existsSync(taskkillExe)) {
                execSync(`"${taskkillExe}" /F /T /PID ${pid}`, { stdio: 'ignore' });
              } else {
                execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
              }
              console.log(`[INFO] Terminated lingering PID: ${pid}`);
            } catch {}
          }
        }
        fs.unlinkSync(pidFile);
      } catch {}
    }
  }

  // 4. Fallback cleanup via PowerShell for any stubborn process on ports 5173 or 4173
  const check5173 = await isPortOpen(5173);
  const check4173 = await isPortOpen(4173);

  if (check5173 || check4173) {
    try {
      if (fs.existsSync(powershellExe)) {
        const psCmd = '$ports = @(5173, 4173); foreach ($port in $ports) { $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if ($conns) { foreach ($conn in $conns) { $p = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue; if ($p -and $p.ProcessName -match "node") { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } } } }';
        execSync(`"${powershellExe}" -NoProfile -ExecutionPolicy Bypass -Command "${psCmd}"`, { stdio: 'ignore' });
      }
    } catch {}
  }

  console.log('[SUCCESS] All Yoga Studio servers stopped.');
}

main();
