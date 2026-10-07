/**
 * `node scripts/human-viewer/human-viewer-control.mts <status|stop>` from `test/`.
 * Reads the resident viewer's health and this checkout's process record, asks
 * `planHumanViewerControl` what to do and does exactly that. It runs under
 * plain Node, with no `ttsx` project check, so it still works while the working
 * tree has a type error that would stop `human-shot.mts` from starting.
 * Stopping kills the recorded process tree and removes the record; nothing is
 * ever selected by name. `HUMAN_VIEWER_PORT` selects the viewer (default 5175)
 * and its process record. Status without a health answer says whether the
 * port refused (absent, exit 3) or accepted without answering (exit 4).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describeHumanViewerSilence } from "./describeHumanViewerSilence.ts";
import { humanViewerErrorCode } from "./humanViewerErrorCode.ts";
import { humanViewerInstance } from "./humanViewerInstance.ts";
import { humanViewerStorage } from "./humanViewerStorage.ts";
import type { IHumanShotHealth } from "./IHumanShotHealth.ts";
import type { IHumanViewerRecord } from "./IHumanViewerRecord.ts";
import { planHumanViewerControl } from "./planHumanViewerControl.ts";
import { humanViewerProtocol } from "./humanViewerProtocol.ts";

const command = process.argv[2];
if (command !== "status" && command !== "stop")
  throw new Error("usage: human-viewer-control.mts <status|stop>");
const instance = humanViewerInstance(process.env.HUMAN_VIEWER_PORT);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const record = path.join(humanViewerStorage(root, process.env.HUMAN_VIEWER_STORAGE_ROOT), instance.record);
const PROBE_MS = 2000;
let health: IHumanShotHealth | null | undefined;
try {
  const response = await fetch(instance.origin + "/health", {
    signal: AbortSignal.timeout(PROBE_MS),
  });
  const body = (await response.json()) as IHumanShotHealth;
  health = body.service === "automovie-human-viewer" ? body : undefined;
} catch (error) {
  health = humanViewerErrorCode(error) === "ECONNREFUSED" ? null : undefined;
}
if (health !== null && health !== undefined && process.env.HUMAN_VIEWER_STORAGE_ROOT &&
  health.storage !== humanViewerStorage(root, process.env.HUMAN_VIEWER_STORAGE_ROOT))
  throw new Error(`Port ${instance.port} does not serve the selected viewer storage; it reports ${health.storage ?? "no storage identity"}`);
const saved = fs.existsSync(record)
  ? (JSON.parse(fs.readFileSync(record, "utf8")) as IHumanViewerRecord)
  : null;
const plan = planHumanViewerControl(command, health, saved);
if (plan.action === "report" && (health === null || health === undefined)) {
  let alive = false;
  if (saved !== null)
    try {
      process.kill(saved.pid, 0);
      alive = true;
    } catch {
      alive = false;
    }
  const silence = describeHumanViewerSilence({ refused: health === null,
    port: instance.port, probeMs: PROBE_MS, recordedPid: saved?.pid ?? null, recordedAlive: alive });
  console.log(JSON.stringify(silence));
  process.exitCode = silence.answer === "absent" ? 3 : 4;
} else if (plan.action === "report") {
  console.log(JSON.stringify(health ?? { ready: false }));
  process.exitCode = health?.protocol === humanViewerProtocol ? plan.exitCode : 3;
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
