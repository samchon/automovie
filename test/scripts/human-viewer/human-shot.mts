/**
 * Thin session-owned client for the resident viewer. Start `ensure` as a
 * background session job; it alone starts a server, owns it as its child and
 * stays attached. Capture commands only reuse a running server: with none
 * they exit 3 and name `ensure`, so no capture ever owns a server that ends
 * with it. Shutdown kills only the verified owned PID tree. Every child is hidden on Windows and no branch or worktree is created.
 * `HUMAN_VIEWER_PORT` (default 5175) selects the viewer, its process record
 * and, for a started server, its listening port, so a session can run its own
 * viewer beside another session's. `status` exits 0 for a ready server, 3 for
 * a not-ready or absent one (connection refused) and 4 when the port accepted
 * the connection but `/health` did not answer within the probe: a listener is
 * alive, and `ensure` never starts a second server on that port. A capture
 * the server marks stale is saved but exits 5, since it does not show the
 * current source.
 */
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describeHumanViewerSilence } from "./describeHumanViewerSilence";
import { humanViewerInstance } from "./humanViewerInstance";
import { parseHumanShotRequest } from "./parseHumanShotRequest";
import { planHumanViewerWatch } from "./planHumanViewerWatch";
import { retryHumanViewerFetch } from "./retryHumanViewerFetch";
import type { IHumanViewerRecord } from "./IHumanViewerRecord";
import type { IHumanShotHealth } from "./IHumanShotHealth";
import { describeHumanViewerError } from "./describeHumanViewerError";
import { humanViewerErrorCode } from "./humanViewerErrorCode";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const storage = path.join(root, ".shots/human-viewer");
const instance = humanViewerInstance(process.env.HUMAN_VIEWER_PORT);
const origin = instance.origin;
const record = path.join(storage, instance.record);
/** How long one `/health` probe waits before it counts as unanswered. */
const PROBE_MS = 8000;
const request = parseHumanShotRequest(process.argv.slice(2));
type Health = IHumanShotHealth;
let owned: ChildProcess | undefined;
/** Output log of a server this client starts, appended across starts. */
const logFile = path.join(storage, instance.log);
/** Why the last probe got no health answer, for the failure message. */
let probeFailure = "";
/**
 * Ask the port for health. A refused connection is an absent viewer (null).
 * Any other failure to get a complete answer, a timeout, a reset or a cut
 * body while the server starts or restarts, is an unanswered port
 * (undefined): something listens, and the caller waits rather than starting
 * or killing anything. Only an answering foreign program is an error.
 */
const probe = async (): Promise<Health | null | undefined> => {
  let text: string;
  try {
    const response = await fetch(origin + "/health", {
      signal: AbortSignal.timeout(PROBE_MS),
    });
    text = await response.text();
  } catch (error) {
    probeFailure = describeHumanViewerError(error);
    return humanViewerErrorCode(error) === "ECONNREFUSED" ? null : undefined;
  }
  let health: Health;
  try {
    health = JSON.parse(text) as Health;
  } catch {
    probeFailure = `/health answered ${text.length} bytes that are not JSON`;
    return undefined;
  }
  if (health?.service !== "automovie-human-viewer")
    throw new Error(`Port ${instance.port} belongs to another program`);
  probeFailure = "";
  return health;
};
const kill = (pid: number): void => {
  if (process.platform === "win32")
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
  else process.kill(pid, "SIGTERM");
};
/**
 * Keep the viewer alive from outside its process. `planHumanViewerWatch` decides
 * from the probe and the watcher's own child: an answering server is left
 * alone, a refused port gets a server, and only the watcher's own child is
 * restarted after `HANG_MS` of silence. A restart kills that child and waits
 * until the port is free before the new server starts, so two servers never
 * contend for it. The watcher owns the started
 * server as a child, so stopping the watcher stops it.
 */
async function watch(): Promise<void> {
  const HANG_MS = 600000;
  let silentSince: number | null = null;
  const pause = (ms: number) =>
    new Promise<undefined>((resolve) => {
      setTimeout(resolve, ms);
    });
  for (;;) {
    let health: Health | null | undefined;
    try {
      health = await probe();
    } catch {
      health = undefined;
    }
    const answered = health?.service !== undefined;
    silentSince = answered ? null : (silentSince ?? Date.now());
    const plan = planHumanViewerWatch({
      answered,
      refused: health === null,
      ownedRunning: owned !== undefined && owned.exitCode === null,
      silentMs: silentSince === null ? 0 : Date.now() - silentSince,
      limitMs: HANG_MS,
    });
    if (plan === "start") {
      console.error("watch: no server, starting");
      start();
      silentSince = Date.now() + 180000;
    } else if (plan === "restart") {
      console.error("watch: own server silent for " + HANG_MS / 1000 + " s, restarting");
      if (owned?.pid) kill(owned.pid);
      fs.rmSync(record, { force: true });
      // The port is released only when the old process is gone.
      for (let wait = 0; wait < 30 && (await probe().catch(() => undefined)) !== null; ++wait)
        await pause(1000);
      start();
      silentSince = Date.now() + 180000;
    }
    await pause(3000);
  }
}
/** This port's process record, or null when no viewer of this checkout recorded one. */
const readRecord = (): IHumanViewerRecord | null =>
  fs.existsSync(record)
    ? (JSON.parse(fs.readFileSync(record, "utf8")) as IHumanViewerRecord)
    : null;
const processAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
async function main(): Promise<void> {
  const health = await probe();
  if (request.command === "status") {
    if (health === null || health === undefined) {
      // Refused and unanswered are different facts: an unanswered port has a
      // live listener, and starting another server on it would contend.
      const saved = readRecord();
      const silence = describeHumanViewerSilence({
        refused: health === null,
        port: instance.port,
        probeMs: PROBE_MS,
        recordedPid: saved?.pid ?? null,
        recordedAlive: saved !== null && processAlive(saved.pid),
      });
      console.log(JSON.stringify(silence));
      process.exitCode = silence.answer === "absent" ? 3 : 4;
      return;
    }
    console.log(JSON.stringify(health));
    process.exitCode = health.ready ? 0 : 3;
    return;
  }
  if (request.command === "stop") {
    if (health === null) {
      console.log("human-viewer absent");
      return;
    }
    if (health === undefined)
      throw new Error("The port is busy; ownership cannot yet be verified");
    const saved = readRecord();
    if (saved === null || saved.pid !== health.pid)
      throw new Error("The running server is not owned by this checkout");
    kill(saved.pid);
    fs.rmSync(record, { force: true });
    return;
  }
  if (request.command === "watch") return watch();
  // Only `ensure` (and the watcher) start a server. A capture command that
  // started one would own it for as long as the capture ran: the server
  // would vanish with the client, and another session's `ensure` would race
  // it for the port. With no server, a capture fails and names the command.
  if (request.command === "ensure") {
    if (health === null) start();
    await ready();
    return;
  }
  // A capture never waits for a server to become ready: it asks a ready one
  // or ends at once with the reason, so it cannot outlive its answer.
  if (health === null || health === undefined) {
    const saved = readRecord();
    const silence = describeHumanViewerSilence({ refused: health === null, port: instance.port,
      probeMs: PROBE_MS, recordedPid: saved?.pid ?? null,
      recordedAlive: saved !== null && processAlive(saved.pid) });
    console.error(silence.answer === "absent"
      ? `No human viewer listens on port ${instance.port}; start one with ` +
        "`human-shot.mts ensure` as an attached background job (with the same HUMAN_VIEWER_PORT)"
      : silence.meaning);
    process.exitCode = silence.answer === "absent" ? 3 : 4;
    return;
  }
  if (!health.ready) {
    console.error(`The human viewer on port ${instance.port} is not ready yet: ${JSON.stringify(health)}`);
    process.exitCode = 3;
    return;
  }
  await capture();
}
/** Start the server as a child of this process. */
function start(): void {
    const require = createRequire(import.meta.url);
    const launcher = path.join(
      path.dirname(require.resolve("ttsc/package.json")),
      "lib/launcher/ttsx.js",
    );
    owned = spawn(
      process.execPath,
      [
        launcher,
        "-P",
        path.join(directory, "tsconfig.node.json"),
        path.join(directory, "server.mts"),
      ],
      {
        cwd: path.join(root, "test"),
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    // Everything the server prints, its fatal error included, reaches both
    // this client's stderr and the port's log file, so a dead server always
    // leaves its cause on disk even when nobody kept the terminal output.
    fs.mkdirSync(storage, { recursive: true });
    const log = fs.createWriteStream(logFile, { flags: "a" });
    log.write(`
=== ${new Date().toISOString()} human-shot ${request.command} starts server.mts on port ${instance.port} (client pid ${process.pid}, server pid ${owned.pid})
`);
    const forward = (bytes: Buffer): void => {
      process.stderr.write(bytes);
      log.write(bytes);
    };
    owned.stdout!.on("data", forward);
    owned.stderr!.on("data", forward);
    owned.once("exit", (code, signal) => {
      log.end(`=== ${new Date().toISOString()} server exited with code ${code} signal ${signal}
`);
    });
    process.once("SIGINT", () => {
      if (owned?.pid) kill(owned.pid);
    });
    process.once("SIGTERM", () => {
      if (owned?.pid) kill(owned.pid);
    });
}
/**
 * Wait until this client's own starting server, or an already running one,
 * is ready, then print its health and, when this client started it, stay
 * attached so the session keeps owning it.
 */
async function ready(): Promise<void> {
  let health = await probe();
  for (let attempt = 0; !health?.ready && attempt < 3000; ++attempt) {
    if (owned?.exitCode !== null && owned?.exitCode !== undefined)
      throw new Error(`The owned viewer exited with code ${owned.exitCode} before readiness; its output is in ${logFile}`);
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    health = await probe();
  }
  if (!health?.ready)
    throw new Error(`The viewer did not become ready${probeFailure === "" ? "" : " (last probe: " + probeFailure + ")"}`);
  console.log(JSON.stringify(health));
  if (owned !== undefined)
    await new Promise<undefined>((resolve) => {
      owned!.once("exit", () => resolve(undefined));
    });
}
/** Ask the ready server for one image or warm answer and write it. */
async function capture(): Promise<void> {
    const response = await retryHumanViewerFetch(
      () => fetch(origin + "/" + request.command + "?" + request.query),
      { attempts: 3, pause: (ms) => new Promise<undefined>((resolve) => { setTimeout(resolve, ms); }) },
    );
    if (!response.ok) throw new Error(await response.text());
    if (request.command === "warm") console.log(await response.text());
    else {
      const filename = path.resolve(
        request.output ??
          path.join(
            storage,
            "captures",
            `${Date.now()}-${request.command}.png`,
          ),
      );
      const relative = path.relative(root, filename);
      if (
        !relative.startsWith("..") &&
        !path.isAbsolute(relative) &&
        !filename.startsWith(storage + path.sep)
      )
        throw new Error(
          "Repository render output belongs under .shots/human-viewer",
        );
      fs.mkdirSync(path.dirname(filename), { recursive: true });
      fs.writeFileSync(filename, Buffer.from(await response.arrayBuffer()));
      const stale = response.headers.get("x-human-stale") === "true";
      console.log(
        JSON.stringify({
          file: filename,
          revision: response.headers.get("x-human-revision"),
          stale,
          renderer: response.headers.get("x-renderer"),
          ms: response.headers.get("x-render-ms"),
        }),
      );
      // The last good generation drew it while the current source failed or
      // rebuilt: the file is kept for reference, but the command fails.
      if (stale) {
        console.error("The frame is stale: it was drawn by an older source generation, not the current source");
        process.exitCode = 5;
      }
    }
}
void main().catch((error: unknown) => {
  const owner = owned?.pid;
  if (owner) kill(owner);
  console.error(describeHumanViewerError(error) +
    (owner ? `; stopped the server this client started (pid ${owner}), output in ${logFile}` : ""));
  process.exitCode = 1;
});
