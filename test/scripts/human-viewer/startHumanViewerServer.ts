import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type { IHumanShotContext } from "./IHumanShotContext";
import { killHumanViewerProcess } from "./killHumanViewerProcess";

/**
 * Start the server as a hidden child of this process through the viewer's
 * ttsx project. Everything the server prints, its fatal error included,
 * reaches both this client's stderr and the port's log file, with a start
 * line and the exit code, so a dead server always leaves its cause on disk.
 * Stopping this client (SIGINT, SIGTERM) stops the child it owns.
 *
 * @evidence contracts/common.md#principled-implementation The client that starts a server owns it as its child, and stops only that child.
 * @evidence contracts/common.md#meaningful-documentation States the logging and the ownership on stop.
 */
export function startHumanViewerServer(context: IHumanShotContext): ChildProcess {
  // Resolved from the viewer's own directory, where its server entry lives.
  const require = createRequire(path.join(context.directory, "server.mts"));
  const launcher = path.join(path.dirname(require.resolve("ttsc/package.json")), "lib/launcher/ttsx.js");
  const owned = spawn(process.execPath,
    [launcher, "-P", path.join(context.directory, "tsconfig.json"), path.join(context.directory, "server.mts")],
    { cwd: path.join(context.root, "test"), windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  fs.mkdirSync(context.storage, { recursive: true });
  const log = fs.createWriteStream(context.logFile, { flags: "a" });
  log.write(`\n=== ${new Date().toISOString()} human-shot ${context.command} starts server.mts on port ${context.port} (client pid ${process.pid}, server pid ${owned.pid})\n`);
  const forward = (bytes: Buffer): void => {
    process.stderr.write(bytes);
    log.write(bytes);
  };
  owned.stdout!.on("data", forward);
  owned.stderr!.on("data", forward);
  owned.once("exit", (code, signal) => {
    log.end(`=== ${new Date().toISOString()} server exited with code ${code} signal ${signal}\n`);
  });
  const stop = (): void => { if (owned.pid) killHumanViewerProcess(owned.pid); };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  return owned;
}
