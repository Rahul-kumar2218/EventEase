import { spawn } from 'child_process';
import path from 'path';

const MONGO_BIN = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
const DB_PATH = path.resolve('server/data/db');

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function waitForServer(url, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
      // Retry
    }
    await wait(500);
  }
  return false;
}

function runScript(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Process ${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

async function main() {
  console.log('------------------------------------------------------------');
  console.log('⚡ STARTING FULL AUTOMATED TEST SUITE FOR EVENTEASE PLATFORM');
  console.log('------------------------------------------------------------');

  let mongoProc = null;
  let serverProc = null;

  try {
    // 1. Start MongoDB
    console.log('[Runner] Starting local MongoDB instance...');
    mongoProc = spawn(MONGO_BIN, ['--dbpath', DB_PATH, '--port', '27017', '--bind_ip', '127.0.0.1'], {
      stdio: 'pipe',
    });
    mongoProc.stdout.on('data', (d) => {
      // console.log(`[mongod] ${d.toString().trim()}`);
    });
    mongoProc.stderr.on('data', (d) => {
      console.error(`[mongod err] ${d.toString().trim()}`);
    });

    await wait(2500);

    // 2. Run Seed
    console.log('[Runner] Running database seeder...');
    await runScript('node', ['server/src/seed.js']);

    // 3. Start Express Server
    console.log('[Runner] Starting EventEase Express backend on port 5000...');
    serverProc = spawn('node', ['server/src/server.js'], {
      stdio: 'inherit',
      env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
    });

    const isHealthy = await waitForServer('http://localhost:5000/api/health');
    if (!isHealthy) {
      throw new Error('Server failed to report healthy on http://localhost:5000/api/health');
    }
    console.log('[Runner] Express Server is ready!\n');

    // 4. Run Original 21-Step Workflow Test
    console.log('>>> RUNNING TEST SUITE 1: 21-STEP CORE WORKFLOW VERIFICATION');
    await runScript('node', ['test-workflow.js']);

    // 5. Run Concurrency Stress Test
    console.log('\n>>> RUNNING TEST SUITE 2: CONCURRENT RACE-CONDITION STRESS TEST');
    await runScript('node', ['test-concurrency.js']);

    // 6. Run Advanced 21-Step Features & Security Test
    console.log('\n>>> RUNNING TEST SUITE 3: ADVANCED 2026 FEATURES & SECURITY AUDIT');
    await runScript('node', ['test-advanced-features.js']);

    console.log('\n============================================================');
    console.log('🏆 ALL TEST SUITES COMPLETED AND PASSED WITH 100% SUCCESS!');
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exitCode = 1;
  } finally {
    console.log('[Runner] Tearing down background test services...');
    if (serverProc) {
      try {
        serverProc.kill();
      } catch (e) {}
    }
    if (mongoProc) {
      try {
        mongoProc.kill();
      } catch (e) {}
    }
    await wait(1000);
  }
}

main();
