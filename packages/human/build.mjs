import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { runHumanBuild } from './build/runHumanBuild.mjs';
import { createHumanBuildFileHost } from './build/createHumanBuildFileHost.mjs';
import { synchronizeHumanBuild } from './build/synchronizeHumanBuild.mjs';

/**
 * Package build entry: own an exclusive stage, compile both supported variants,
 * then replace runtime output. The ordinary compiler and lint remain the
 * authority. Every mutation stays inside this package's real directory; an
 * unrestored previous output is retained for explicit recovery.
 */
const directory = fs.realpathSync.native(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(directory, 'lib');
const lock = path.join(directory, '.human-build.lock');
const require = createRequire(import.meta.url);
const compilerPackage = require.resolve('ttsc/package.json');
const compilerManifest = JSON.parse(fs.readFileSync(compilerPackage, 'utf8'));
const compiler = path.resolve(path.dirname(compilerPackage), compilerManifest.bin.ttsc);
const fileHost = createHumanBuildFileHost(directory);

function owned(candidate) {
  const resolved = path.resolve(candidate);
  const relative = path.relative(directory, resolved);
  if (!relative || relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative))
    throw new Error('Human build refuses a path outside its owning package: ' + candidate);
  return resolved;
}

function previous(stage) { return owned(stage + '-previous'); }
function staged(stage) { return owned(stage); }

const handle = fs.openSync(owned(lock), 'wx');
let recoveryRequired = false;
let retained = false;
let backupComplete = false;
try {
  fs.writeFileSync(handle, JSON.stringify({pid: process.pid, started: new Date().toISOString()}));
  await runHumanBuild({
    createStage() {
      if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink())
        throw new Error('Human build refuses to replace a linked runtime output directory.');
      const stage = fs.mkdtempSync(owned(path.join(directory, '.human-build-')));
      return stage;
    },
    async compile(stage, pass) {
      const destination = pass === 'browser' ? owned(path.join(staged(stage), 'browser')) : staged(stage);
      const args = [compiler, '--outDir', destination];
      if (pass === 'browser') args.push('--module', 'esnext', '--moduleResolution', 'bundler');
      const child = spawn(process.execPath, args, {
        cwd: directory,
        windowsHide: true,
        stdio: 'inherit',
      });
      await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (code, signal) => {
          if (code === 0) resolve();
          else reject(new Error('Human ' + pass + ' compiler failed (exit ' + code + ', signal ' + signal + ').'));
        });
      });
    },
    hasPrevious: () => fs.existsSync(output),
    backup: (stage) => {
      fileHost.files(output);
      fs.cpSync(owned(output), previous(stage), { recursive: true, errorOnExist: true, force: false });
      backupComplete = true;
    },
    install: (stage) => synchronizeHumanBuild(fileHost, staged(stage), owned(output)),
    restore: (stage) => {
      try { synchronizeHumanBuild(fileHost, fs.existsSync(previous(stage)) ? previous(stage) : undefined, owned(output)); }
      catch (error) { recoveryRequired = true; throw error; }
    },
    removeBackup: (stage) => fs.rmSync(previous(stage), {recursive: true}),
    discardStage(stage) {
      if (recoveryRequired || (backupComplete && fs.existsSync(previous(stage)))) {
        retained = true;
        fs.ftruncateSync(handle, 0);
        fs.writeSync(handle, JSON.stringify({ pid: process.pid, recovery: stage, backup: previous(stage), publicationUnresolved: true }), 0);
        console.error('Human build retained recovery files and its publication lock at ' + stage);
        return;
      }
      if (!backupComplete && fs.existsSync(previous(stage)))
        fs.rmSync(previous(stage), { recursive: true });
      fs.rmSync(owned(stage), {recursive: true});
    },
  });
} finally {
  fs.closeSync(handle);
  if (!retained) fs.unlinkSync(owned(lock));
}
