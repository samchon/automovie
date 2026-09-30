/**
 * Thin session-owned client for the resident viewer. Start `ensure` as a
 * background session job; later capture commands reuse it. A capture with no
 * server starts one and remains attached after writing its PNG, so the session
 * continues to own that process. Shutdown kills only the verified owned PID
 * tree. Every child is hidden on Windows and no branch or worktree is created.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { parseHumanShotRequest } from "./parseHumanShotRequest";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const storage = path.join(root, ".shots/human-viewer");
const origin = "http://127.0.0.1:5175";
const request = parseHumanShotRequest(process.argv.slice(2));
type Health = { service: string; pid: number; revision: string; renderer: string; ready: boolean; errors: string[] };
let owned: ChildProcess | undefined;
const probe = async (): Promise<Health | null> => {
  try {
    const response = await fetch(origin + "/health", { signal: AbortSignal.timeout(2000) });
    const health = await response.json() as Health;
    if (health.service !== "automovie-human-viewer") throw new Error("The port belongs to another program");
    return health;
  } catch (error) {
    if ((error as { cause?: { code?: string } }).cause?.code === "ECONNREFUSED") return null;
    throw error;
  }
};
const kill = (pid: number): void => {
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
  else process.kill(pid, "SIGTERM");
};
async function main(): Promise<void> {
  let health = await probe();
  if (request.command === "status") { console.log(JSON.stringify(health ?? { ready: false })); process.exitCode = health?.ready ? 0 : 3; return; }
  if (request.command === "stop") {
    const record = path.join(storage, "server.json");
    if (health === null) { console.log("human-viewer absent"); return; }
    const saved = fs.existsSync(record) ? JSON.parse(fs.readFileSync(record, "utf8")) as { pid: number } : null;
    if (saved === null || saved.pid !== health.pid) throw new Error("The running server is not owned by this checkout");
    kill(saved.pid); fs.rmSync(record, { force: true }); return;
  }
  if (health === null) {
    const require = createRequire(import.meta.url);
    const launcher = path.join(path.dirname(require.resolve("ttsc/package.json")), "lib/launcher/ttsx.js");
    owned = spawn(process.execPath, [launcher, "-P", path.join(directory, "tsconfig.json"), path.join(directory, "server.mts")], {
      cwd: path.join(root, "test"), windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    });
    owned.stdout!.on("data", (bytes: Buffer) => process.stderr.write(bytes));
    owned.stderr!.on("data", (bytes: Buffer) => process.stderr.write(bytes));
    process.once("SIGINT", () => { if (owned?.pid) kill(owned.pid); });
    process.once("SIGTERM", () => { if (owned?.pid) kill(owned.pid); });
  }
  for (let attempt = 0; !health?.ready && attempt < 3000; ++attempt) {
    if (owned?.exitCode !== null && owned?.exitCode !== undefined) throw new Error("The owned viewer exited before readiness");
    await new Promise((resolve) => { setTimeout(resolve, 200); });
    health = await probe();
  }
  if (!health?.ready) throw new Error("The viewer did not become ready");
  if (request.command === "ensure") console.log(JSON.stringify(health));
  else {
    const response = await fetch(origin + "/" + request.command + "?" + request.query);
    if (!response.ok) throw new Error(await response.text());
    if (request.command === "warm") console.log(await response.text());
    else {
      const filename = path.resolve(request.output ?? path.join(storage, "captures", `${Date.now()}-${request.command}.png`));
      const relative = path.relative(root, filename);
      if (!relative.startsWith("..") && !path.isAbsolute(relative) && !filename.startsWith(storage + path.sep)) throw new Error("Repository render output belongs under .shots/human-viewer");
      fs.mkdirSync(path.dirname(filename), { recursive: true });
      fs.writeFileSync(filename, Buffer.from(await response.arrayBuffer()));
      console.log(JSON.stringify({ file: filename, revision: response.headers.get("x-human-revision"), renderer: response.headers.get("x-renderer"), ms: response.headers.get("x-render-ms") }));
    }
  }
  if (owned !== undefined) await new Promise<void>((resolve) => { owned!.once("exit", () => resolve()); });
}
void main().catch((error: unknown) => { if (owned?.pid) kill(owned.pid); console.error(String(error)); process.exitCode = 1; });
