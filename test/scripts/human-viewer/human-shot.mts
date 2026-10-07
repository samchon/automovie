/**
 * Thin session-owned client for the resident viewer. Start `ensure` as a
 * background session job; it alone starts a server, owns it as its child and
 * stays attached. Capture commands only reuse a running server: with none
 * they exit 3 and name `ensure`, so no capture ever owns a server that ends
 * with it. Shutdown kills only the verified owned PID tree. Every child is
 * hidden on Windows and no branch or worktree is created.
 * `HUMAN_VIEWER_PORT` (default 5175) selects the viewer, its process record
 * and, for a started server, its listening port, so a session can run its own
 * viewer beside another session's. `status` exits 0 for a ready server, 3 for
 * a not-ready or absent one (connection refused) and 4 when the port accepted
 * the connection but `/health` did not answer within the probe: a listener is
 * alive, and `ensure` never starts a second server on that port. A capture
 * the server marks stale is saved but exits 5, since it does not show the
 * current source. This entry resolves the request and dispatches each
 * command to its own step.
 */
import type { ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { IHumanShotContext } from "./IHumanShotContext";
import { awaitHumanViewerReady } from "./awaitHumanViewerReady";
import { captureHumanViewerShot } from "./captureHumanViewerShot";
import { describeHumanShotSilence } from "./describeHumanShotSilence";
import { describeHumanViewerError } from "./describeHumanViewerError";
import { humanViewerInstance } from "./humanViewerInstance";
import { humanViewerStorage } from "./humanViewerStorage";
import { killHumanViewerProcess } from "./killHumanViewerProcess";
import { parseHumanShotRequest } from "./parseHumanShotRequest";
import { probeHumanViewer } from "./probeHumanViewer";
import { startHumanViewerServer } from "./startHumanViewerServer";
import { stopHumanViewerServer } from "./stopHumanViewerServer";
import { watchHumanViewer } from "./watchHumanViewer";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const storage = humanViewerStorage(root, process.env.HUMAN_VIEWER_STORAGE_ROOT);
const instance = humanViewerInstance(process.env.HUMAN_VIEWER_PORT);
const request = parseHumanShotRequest(process.argv.slice(2));
const context: IHumanShotContext = {
  directory,
  root,
  storage,
  origin: instance.origin,
  port: instance.port,
  record: path.join(storage, instance.record),
  logFile: path.join(storage, instance.log),
  probeMs: 8000,
  command: request.command,
  query: request.query,
  output: request.output,
};
/** The server this client started, stopped if the client fails. */
let owned: ChildProcess | undefined;

async function main(): Promise<void> {
  const probe = await probeHumanViewer(context);
  const health = probe.health;
  if (request.command === "status") {
    if (health === null || health === undefined) {
      const silence = describeHumanShotSilence(context, health === null);
      console.log(JSON.stringify(silence));
      process.exitCode = silence.answer === "absent" ? 3 : 4;
      return;
    }
    console.log(JSON.stringify(health));
    process.exitCode = health.ready ? 0 : 3;
    return;
  }
  if (request.command === "stop") return stopHumanViewerServer(context, probe);
  if (request.command === "watch") return watchHumanViewer(context);
  // Only `ensure` (and the watcher) start a server. A capture command that
  // started one would own it for as long as the capture ran: the server
  // would vanish with the client, and another session's `ensure` would race
  // it for the port.
  if (request.command === "ensure") {
    if (health === null) owned = startHumanViewerServer(context);
    return awaitHumanViewerReady(context, owned);
  }
  // A capture never waits for a server to become ready: it asks a ready one
  // or ends at once with the reason, so it cannot outlive its answer.
  if (health === null || health === undefined) {
    const silence = describeHumanShotSilence(context, health === null);
    console.error(
      silence.answer === "absent"
        ? `No human viewer listens on port ${instance.port}; start one with ` +
            "`human-shot.mts ensure` as an attached background job (with the same HUMAN_VIEWER_PORT)"
        : silence.meaning,
    );
    process.exitCode = silence.answer === "absent" ? 3 : 4;
    return;
  }
  if (!health.ready) {
    console.error(
      `The human viewer on port ${instance.port} is not ready yet: ${JSON.stringify(health)}`,
    );
    process.exitCode = 3;
    return;
  }
  await captureHumanViewerShot(context);
}
void main().catch((error: unknown) => {
  const owner = owned?.pid;
  if (owner) killHumanViewerProcess(owner);
  console.error(
    describeHumanViewerError(error) +
      (owner
        ? `; stopped the server this client started (pid ${owner}), output in ${context.logFile}`
        : ""),
  );
  process.exitCode = 1;
});
