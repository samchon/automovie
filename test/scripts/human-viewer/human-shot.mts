/**
 * Thin session-owned client for the resident viewer. Start `ensure` as a
 * background session job; later capture commands reuse it. A capture with no
 * server starts one and remains attached after writing its PNG, so the session
 * continues to own that process. Shutdown kills only the verified owned PID
 * tree. Every child is hidden on Windows and no branch or worktree is created.
 * `HUMAN_VIEWER_PORT` (default 5175) selects the viewer, its process record
 * and, for a started server, its listening port, so a session can run its own
 * viewer beside another session's. `status` exits 0 for a ready server, 3 for
 * a not-ready or absent one (connection refused) and 4 when the port accepted
 * the connection but `/health` did not answer within the probe: a listener is
 * alive, and `ensure` never starts a second server on that port.
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

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const storage = path.join(root, ".shots/human-viewer");
const instance = humanViewerInstance(process.env.HUMAN_VIEWER_PORT);
const origin = instance.origin;
const record = path.join(storage, instance.record);
/** How long one `/health` probe waits before it counts as unanswered. */
const PROBE_MS = 8000;
const request = parseHumanShotRequest(process.argv.slice(2));
type Health = {
  service: string;
  pid: number;
  revision: string;
  renderer: string;
  ready: boolean;
  errors: string[];
};
let owned: ChildProcess | undefined;
const probe = async (): Promise<Health | null | undefined> => {
  try {
    const response = await fetch(origin + "/health", {
      signal: AbortSignal.timeout(PROBE_MS),
    });
    const health = (await response.json()) as Health;
    if (health.service !== "automovie-human-viewer")
      throw new Error("The port belongs to another program");
    return health;
  } catch (error) {
    if ((error as { cause?: { code?: string } }).cause?.code === "ECONNREFUSED")
      return null;
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    )
      return undefined;
    throw error;
  }
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
 * from the recorded process and the probe: an answering server is left alone,
 * a silent one whose recorded process is alive is busy and waited for until
 * `HANG_MS`, and only a dead one is started. A restart kills the recorded and
 * owned processes and waits until the port is free before the new server
 * starts, so two servers never contend for it. The watcher owns the started
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
    const saved = readRecord();
    const answered = health?.service !== undefined;
    silentSince = answered ? null : (silentSince ?? Date.now());
    const plan = planHumanViewerWatch({
      answered,
      recordedAlive: saved !== null && processAlive(saved.pid),
      ownedRunning: owned !== undefined && owned.exitCode === null,
      silentMs: silentSince === null ? 0 : Date.now() - silentSince,
      limitMs: HANG_MS,
    });
    if (plan === "start") {
      console.error("watch: no server, starting");
      start();
      silentSince = Date.now() + 180000;
    } else if (plan === "restart") {
      console.error("watch: server silent for " + HANG_MS / 1000 + " s, restarting");
      if (saved !== null) kill(saved.pid);
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
  if (health === null) {
    start();
  }
  await ready();
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
    owned.stdout!.on("data", (bytes: Buffer) => process.stderr.write(bytes));
    owned.stderr!.on("data", (bytes: Buffer) => process.stderr.write(bytes));
    process.once("SIGINT", () => {
      if (owned?.pid) kill(owned.pid);
    });
    process.once("SIGTERM", () => {
      if (owned?.pid) kill(owned.pid);
    });
}
async function ready(): Promise<void> {
  let health = await probe();
  for (let attempt = 0; !health?.ready && attempt < 3000; ++attempt) {
    if (owned?.exitCode !== null && owned?.exitCode !== undefined)
      throw new Error("The owned viewer exited before readiness");
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    health = await probe();
  }
  if (!health?.ready) throw new Error("The viewer did not become ready");
  if (request.command === "ensure") console.log(JSON.stringify(health));
  else {
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
      console.log(
        JSON.stringify({
          file: filename,
          revision: response.headers.get("x-human-revision"),
          renderer: response.headers.get("x-renderer"),
          ms: response.headers.get("x-render-ms"),
        }),
      );
    }
  }
  if (owned !== undefined)
    await new Promise<undefined>((resolve) => {
      owned!.once("exit", () => resolve(undefined));
    });
}
void main().catch((error: unknown) => {
  if (owned?.pid) kill(owned.pid);
  console.error(String(error));
  process.exitCode = 1;
});
