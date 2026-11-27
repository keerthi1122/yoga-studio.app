import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import fs from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminDir = path.resolve(__dirname, 'admin_dashboard');
const outerDir = path.resolve(__dirname, '..');

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function probePort(port) {
  return new Promise(resolve => {
    const s = net.createConnection({ port, host: '127.0.0.1' }, () => {
      s.destroy();
      resolve(true);
    });
    s.setTimeout(1000);
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.on('error', () => resolve(false));
  });
}

async function fetchUrl(url, isHttps = false) {
  return new Promise(resolve => {
    const client = isHttps ? https : http;
    const req = client.get(url, { rejectUnauthorized: false, timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', err => resolve({ status: 0, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'TIMEOUT' }); });
  });
}

async function run() {
  console.log('=== RUNNING COMPREHENSIVE VERIFICATION SUITE ===');
  let allPassed = true;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      allPassed = false;
    }
  }

  // Test 1: Check initial port state
  const portOpenBefore = await probePort(5173);
  assert(!portOpenBefore, 'Test 1: Port 5173 initial state is closed');

  // Test 2: Start Dev server via run_dev.mjs
  console.log('[INFO] Booting Dev Server...');
  const devProc = spawn(process.execPath, [path.join(adminDir, 'run_dev.mjs')], {
    cwd: adminDir,
    stdio: 'ignore'
  });

  let ready = false;
  for (let i = 0; i < 30; i++) {
    await wait(400);
    if (await probePort(5173)) {
      ready = true;
      break;
    }
  }
  assert(ready, 'Test 2: Dev Server listening on port 5173');

  // Test 3: Dev Server HTTP response
  const devResp = await fetchUrl('https://localhost:5173/', true);
  assert(devResp.status === 200 && devResp.data.includes('<title>'), 'Test 3: Dev Server returned 200 OK with valid HTML');

  // Test 4: check_port.mjs accuracy when port is open
  try {
    execSync(`node "${path.join(adminDir, 'check_port.mjs')}" 5173`, { stdio: 'ignore' });
    assert(true, 'Test 4: check_port.mjs detects open port 5173 (exit 0)');
  } catch {
    assert(false, 'Test 4: check_port.mjs failed to detect open port 5173');
  }

  // Test 5: Dev Server graceful shutdown
  console.log('[INFO] Triggering graceful shutdown for Dev Server...');
  const shutdownResp = await fetchUrl('https://localhost:5173/__shutdown', true);
  assert(shutdownResp.status === 200, 'Test 5: /__shutdown endpoint responded 200 OK');

  let devClosed = false;
  for (let i = 0; i < 20; i++) {
    await wait(200);
    if (!(await probePort(5173))) {
      devClosed = true;
      break;
    }
  }
  assert(devClosed, 'Test 5b: Port 5173 released after graceful shutdown');

  // Test 6: check_port.mjs accuracy when port is closed
  try {
    execSync(`node "${path.join(adminDir, 'check_port.mjs')}" 5173`, { stdio: 'ignore' });
    assert(false, 'Test 6: check_port.mjs should exit 1 when port 5173 is closed');
  } catch {
    assert(true, 'Test 6: check_port.mjs detects closed port 5173 (exit 1)');
  }

  // Test 7: Production Server (serve_production.mjs)
  console.log('[INFO] Booting Production Preview Server...');
  const prodProc = spawn(process.execPath, [path.join(adminDir, 'serve_production.mjs')], {
    cwd: adminDir,
    stdio: 'ignore'
  });

  let prodReady = false;
  for (let i = 0; i < 25; i++) {
    await wait(400);
    if (await probePort(4173)) {
      prodReady = true;
      break;
    }
  }
  assert(prodReady, 'Test 7: Production Preview Server listening on port 4173');

  // Test 8: Production root response
  const prodResp = await fetchUrl('http://localhost:4173/', false);
  assert(prodResp.status === 200 && prodResp.data.includes('GVYA'), 'Test 8: Production Server root returned 200 OK');

  // Test 9: SPA deep routing fallback (/classes)
  const spaResp = await fetchUrl('http://localhost:4173/classes', false);
  assert(spaResp.status === 200 && spaResp.data.includes('id="root"'), 'Test 9: SPA deep route /classes returned 200 OK with root div');

  // Test 10: Production Server graceful shutdown
  console.log('[INFO] Triggering graceful shutdown for Production Server...');
  const prodShutdownResp = await fetchUrl('http://localhost:4173/__shutdown', false);
  assert(prodShutdownResp.status === 200, 'Test 10: Production /__shutdown responded 200 OK');

  let prodClosed = false;
  for (let i = 0; i < 20; i++) {
    await wait(200);
    if (!(await probePort(4173))) {
      prodClosed = true;
      break;
    }
  }
  assert(prodClosed, 'Test 10b: Port 4173 released after shutdown');

  // Test 11: Idempotent stop_server.mjs execution when no server is running
  try {
    execSync(`node "${path.join(adminDir, 'stop_server.mjs')}"`, { stdio: 'ignore' });
    assert(true, 'Test 11: stop_server.mjs executes idempotently without errors');
  } catch {
    assert(false, 'Test 11: stop_server.mjs crashed on idle system');
  }

  // Test 12: File existence & parity in both outer and inner locations
  const requiredFiles = [
    'start_app.bat',
    'start_app.vbs',
    'stop_app.bat',
    'stop_app.vbs',
    'start_preview.bat',
    'start_preview.vbs',
    'deploy_firebase.bat',
    'create_desktop_shortcut.bat',
    'QUICK_START_LAUNCHER_GUIDE.md',
  ];

  let filesOk = true;
  for (const file of requiredFiles) {
    const outerPath = path.join(outerDir, file);
    const innerPath = path.join(__dirname, file);
    if (!fs.existsSync(outerPath) || !fs.existsSync(innerPath)) {
      filesOk = false;
      console.error(`Missing launcher file: ${file}`);
    }
  }
  assert(filesOk, 'Test 12: All 9 launcher files exist in both outer and inner root paths');

  // Test 13: Stray file check (ensure no stray '{' or temporary files exist)
  const strayFile = path.join(outerDir, '{');
  assert(!fs.existsSync(strayFile), 'Test 13: Stray temporary files verified deleted');

  console.log('\n=================================================');
  if (allPassed) {
    console.log('🎉 ALL 13 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME VERIFICATION TESTS FAILED.');
  }
  console.log('=================================================\n');

  process.exit(allPassed ? 0 : 1);
}

run();
