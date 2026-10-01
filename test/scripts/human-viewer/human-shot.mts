/**
 * Thin session-owned client for the resident viewer. Start `ensure` as a
 * background session job; later capture commands reuse it. A capture with no
 * server starts one and remains attached after writing its PNG, so the session
 * continues to own that process. Shutdown kills only the verified owned PID
 * tree. Every child is hidden on Windows and no branch or worktree is created.
 */
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseHumanShotRequest } from "./parseHumanShotRequest";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const storage = path.join(root, ".shots/human-viewer");
const origin = "http://127.0.0.1:5175";
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
      signal: AbortSignal.timeout(2000),
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
 * Keep the viewer alive from outside its process. A server that answers
 * nothing for `STALL_MS` (a refused connection counts, since a full listen
 * backlog refuses) is killed by the pid it recorded and started again, and an
 * absent one is started at once. The watcher owns the restarted server as a
 * child, so stopping the watcher stops it.
 */
async function watch(): Promise<void> {
  const STALL_MS = 30000;
  let silentSince: number | null = null;
  for (;;) {
    let health: Health | null | undefined;
    try {
      health = await probe();
    } catch {
      health = undefined;
    }
    const record = path.join(storage, "server.json");
    const saved = fs.existsSync(record)
      ? (JSON.parse(fs.readFileSync(record, "utf8")) as { pid: number })
      : null;
    if (health?.ready === true || health?.service !== undefined) silentSince = null;
    else {
      silentSince ??= Date.now();
      const alive = saved !== null && processAlive(saved.pid);
      if (!alive && owned?.exitCode !== null) {
        console.error("watch: no server, starting");
        start();
        silentSince = Date.now() + 180000;
      } else if (Date.now() - silentSince > STALL_MS) {
        console.error("watch: server silent for " + STALL_MS / 1000 + " s, restarting");
        if (saved !== null) kill(saved.pid);
        if (owned?.pid) kill(owned.pid);
        fs.rmSync(record, { force: true });
        await new Promise((resolve) => {
          setTimeout(resolve, 3000);
        });
        start();
        silentSince = Date.now() + 180000;
      }
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
  }
}
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
    console.log(JSON.stringify(health ?? { ready: false }));
    process.exitCode = health?.ready ? 0 : 3;
    return;
  }
  if (request.command === "stop") {
    const record = path.join(storage, "server.json");
    if (health === null) {
      console.log("human-viewer absent");
      return;
    }
    if (health === undefined)
      throw new Error("The port is busy; ownership cannot yet be verified");
    const saved = fs.existsSync(record)
      ? (JSON.parse(fs.readFileSync(record, "utf8")) as { pid: number })
      : null;
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
    const response = await fetch(
      origin + "/" + request.command + "?" + request.query,
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
