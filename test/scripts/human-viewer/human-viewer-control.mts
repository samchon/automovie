/**
 * `node scripts/human-viewer/human-viewer-control.mts <status|stop>` from `test/`.
 * Reads the resident viewer's health and this checkout's process record, asks
 * `planHumanViewerControl` what to do and does exactly that. It runs under
 * plain Node, with no `ttsx` project check, so it still works while the working
 * tree has a type error that would stop `human-shot.mts` from starting.
 * Stopping kills the recorded process tree and removes the record; nothing is
 * ever selected by name.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { planHumanViewerControl } from "./planHumanViewerControl.ts";

const command = process.argv[2];
if (command !== "status" && command !== "stop")
  throw new Error("usage: human-viewer-control.mts <status|stop>");
const record = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.shots/human-viewer/server.json",
);
let health: { pid: number; ready: boolean } | null | undefined;
try {
  const response = await fetch("http://127.0.0.1:5175/health", {
    signal: AbortSignal.timeout(2000),
  });
  const body = (await response.json()) as {
    service: string;
    pid: number;
    ready: boolean;
  };
  health = body.service === "automovie-human-viewer" ? body : undefined;
} catch (error) {
  health =
    (error as { cause?: { code?: string } }).cause?.code === "ECONNREFUSED"
      ? null
      : undefined;
}
const saved = fs.existsSync(record)
  ? (JSON.parse(fs.readFileSync(record, "utf8")) as { pid: number })
  : null;
const plan = planHumanViewerControl(command, health, saved);
if (plan.action === "report") {
  console.log(JSON.stringify(health ?? { ready: false }));
  process.exitCode = plan.exitCode;
} else if (plan.action === "absent") console.log("human-viewer absent");
else if (plan.action === "refuse") {
  console.error(plan.reason);
  process.exitCode = 1;
} else {
  if (process.platform === "win32")
    spawnSync("taskkill", ["/PID", String(plan.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
  else process.kill(plan.pid, "SIGTERM");
  fs.rmSync(record, { force: true });
  console.log("stopped " + plan.pid);
}
