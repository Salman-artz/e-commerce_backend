const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const tscBin = require.resolve('typescript/bin/tsc');
const distRoot = path.join('dist');
const serverEntry = path.join('dist', 'src', 'server.js');
const restartDelayMs = 200;

function startProcess(command, args) {
  return spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    windowsHide: true
  });
}

function stopProcess(child) {
  if (!child || child.killed) {
    return;
  }

  try {
    child.kill();
  } catch {
    // Ignore shutdown errors.
  }
}

const build = spawnSync(process.execPath, [tscBin, '-p', 'tsconfig.json'], {
  stdio: 'inherit',
  shell: false,
  windowsHide: true
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const tscWatch = startProcess(process.execPath, [tscBin, '-p', 'tsconfig.json', '--watch', '--preserveWatchOutput']);

let server = null;
let shuttingDown = false;
let restartingServer = false;
let restartTimer = null;
let watcher = null;

function launchServer() {
  if (shuttingDown) {
    return;
  }

  server = startProcess(process.execPath, [serverEntry]);
  server.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    server = null;

    if (restartingServer) {
      restartingServer = false;
      launchServer();
      return;
    }

    const exitCode = code ?? 0;
    const reason = signal ? ` signal ${signal}` : '';
    console.error(`Server exited with code ${exitCode}${reason}. Waiting for the next build...`);
  });
}

function restartServer() {
  if (shuttingDown) {
    return;
  }

  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    restartTimer = null;

    if (shuttingDown) {
      return;
    }

    if (!server || server.exitCode !== null || server.signalCode !== null) {
      launchServer();
      return;
    }

    restartingServer = true;
    stopProcess(server);
  }, restartDelayMs);
}

try {
  watcher = fs.watch(distRoot, { recursive: true }, (_eventType, filename) => {
    if (filename) {
      restartServer();
    }
  });
} catch (error) {
  console.error('Failed to watch build output:', error);
  process.exit(1);
}

function cleanup() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  try {
    watcher?.close();
  } catch {
    // Ignore shutdown errors.
  }

  stopProcess(tscWatch);
  stopProcess(server);
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  shuttingDown = true;
  stopProcess(tscWatch);
  stopProcess(server);
});

tscWatch.on('exit', (code) => {
  if (shuttingDown) {
    return;
  }

  if (code && code !== 0) {
    console.error(`TypeScript watcher exited with code ${code}.`);
    cleanup();
  }
});

launchServer();
