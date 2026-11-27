import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pidFile = path.resolve(__dirname, '.server.pid');

const viteBin = path.resolve(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const args = [viteBin, '--host', '--port', '5173'];
if (process.argv.includes('--open')) {
  args.push('--open');
}

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env,
});

try {
  fs.writeFileSync(pidFile, `${process.pid}\n${child.pid}`);
} catch {}

const cleanup = () => {
  try {
    if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  } catch {}
};

child.on('exit', (code) => {
  cleanup();
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  cleanup();
  try { child.kill('SIGINT'); } catch {}
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  try { child.kill('SIGTERM'); } catch {}
  process.exit(0);
});
