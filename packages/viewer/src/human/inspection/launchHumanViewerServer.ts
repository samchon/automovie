import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { ProcessOwnership } from "../../process/ProcessOwnership.js";
import { reportAutoMovieResourceRetirement } from "../../reportAutoMovieResourceRetirement.js";
import type { IHumanShotContext } from "./IHumanShotContext.js";

/**
 * Start this client's hidden plain-Node launcher, which holds its port and builds the actual server as its child. Both output pipes forward to client stderr and the selected log. Native close, after output pipes settle, ends that log and detaches this client's signal bindings.
 *
 * Filesystem preparation precedes child acquisition. A later synchronous failure independently requests captured-identity stop and log destruction. If OS creation capture itself failed, ProcessOwnership refuses termination; that original and cleanup cause remain failures, not proof of child exit. Log failure reports its cause and requests only this captured child's stop.
 *
 * @evidence contracts/common.md#principled-implementation The existing plain-Node launcher starts hidden under the application cwd, its original ChildProcess identity is captured and actual pipe bytes forward to client stderr plus the per-port log.
 * @evidence contracts/common.md#clear-and-simple-design One child, log and pair of client signal bindings define the launcher lifetime without another server host or process identity policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native close rather than early exit ends the log after output drains, and failed creation-stamp capture cannot be bypassed by signalling an unverified PID.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes filesystem preparation, captured stop attempts, uncertain failure cleanup and per-client signal ownership.
 * @evidence contracts/performance.md#efficient-algorithms Output forwarding is linear in actual emitted bytes and process identity discovery remains with the native owner; no output parsing or whole-log reread occurs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Launch creates a distinct owned process effect and does not share another client's server simply because port text matches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Native close removes signals and ends the log; partial acquisition attempts child/log cleanup independently, failed identity capture can leave uncertain child lifetime and forwarding buffers have no independent cap/backpressure policy here.
 */
export function launchHumanViewerServer(
  context: IHumanShotContext,
): ChildProcess {
  fs.mkdirSync(context.storage, { recursive: true });
  const log: fs.WriteStream = fs.createWriteStream(context.logFile, {
    flags: "a",
  });
  let owned: ChildProcess | undefined;
  try {
    owned = spawn(
      process.execPath,
      [
        path.join(
          context.directory,
          import.meta.url.endsWith(".ts")
            ? "human-viewer-launcher.ts"
            : "human-viewer-launcher.js",
        ),
      ],
      {
        cwd: context.root,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const child: ChildProcess = owned;
    function stop(): void {
      ProcessOwnership.stopChild(child);
    }
    log.once("error", (error: Error): void => {
      console.error(error);
      try {
        stop();
      } catch (cause) {
        console.error(cause);
      }
    });
    child.once("error", (error: Error): void => {
      console.error(error);
    });
    ProcessOwnership.own(child);
    log.write(
      `\n=== ${new Date().toISOString()} human-shot ${context.command} starts server.ts on port ${context.port} (client pid ${process.pid}, server pid ${child.pid})\n`,
    );
    const forward: (bytes: Buffer) => void = (bytes: Buffer): void => {
      process.stderr.write(bytes);
      log.write(bytes);
    };
    child.stdout!.on("data", forward);
    child.stderr!.on("data", forward);
    child.once(
      "close",
      (code: number | null, signal: NodeJS.Signals | null): void => {
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
        log.end(
          `=== ${new Date().toISOString()} server exited with code ${code} signal ${signal}\n`,
        );
      },
    );
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    return child;
  } catch (error) {
    reportAutoMovieResourceRetirement(
      [
        (): void => {
          if (owned !== undefined) ProcessOwnership.stopChild(owned);
        },
        (): void => {
          log.destroy();
        },
      ],
      { error },
    );
    throw error;
  }
}
