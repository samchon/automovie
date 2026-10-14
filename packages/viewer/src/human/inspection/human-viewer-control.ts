import type { HumanViewerControlPlan } from "@automovie/viewer/human/inspection/HumanViewerControlPlan";
import type { IHumanShotHealth } from "@automovie/viewer/human/inspection/IHumanShotHealth";
import type { IHumanViewerInstance } from "@automovie/viewer/human/inspection/IHumanViewerInstance";
import type { IHumanViewerRecord } from "@automovie/viewer/human/inspection/IHumanViewerRecord";
import type { IHumanViewerSilence } from "@automovie/viewer/human/inspection/IHumanViewerSilence";
import { describeHumanViewerSilence } from "@automovie/viewer/human/inspection/describeHumanViewerSilence";
import { humanViewerErrorCode } from "@automovie/viewer/human/inspection/humanViewerErrorCode";
import { humanViewerInstance } from "@automovie/viewer/human/inspection/humanViewerInstance";
import { humanViewerProtocol } from "@automovie/viewer/human/inspection/humanViewerProtocol";
import { humanViewerStorage } from "@automovie/viewer/human/inspection/humanViewerStorage";
import { planHumanViewerControl } from "@automovie/viewer/human/inspection/planHumanViewerControl";
import { ProcessOwnership } from "@automovie/viewer/process/ProcessOwnership";
/**
 * `node src/human/inspection/human-viewer-control.ts <status|stop>` from `packages/viewer/`.
 * Reads the resident viewer's health and this checkout's process record, asks
 * `planHumanViewerControl` what to do and does exactly that. It runs under
 * plain Node, with no `ttsx` project check, so it still works while the working
 * tree has a type error that would stop `human-shot.ts` from starting.
 * Stop verifies the recorded OS creation identity and admits only Windows
 * descendants whose creation order proves the current parent relation;
 * reused PIDs and old records without that identity are refused. Nothing is
 * ever selected by name. `HUMAN_VIEWER_PORT` selects the viewer (default 5175)
 * and its process record. Status without a health answer says whether the
 * port refused (absent, exit 3) or accepted without answering (exit 4).
 */
import fs from "node:fs";
import path from "node:path";

const command: string = process.argv[2];
if (command !== "status" && command !== "stop")
  throw new Error("usage: human-viewer-control.ts <status|stop>");
const instance: IHumanViewerInstance = humanViewerInstance(
  process.env.HUMAN_VIEWER_PORT,
);
const root: string = path.resolve(
  process.env.HUMAN_VIEWER_ROOT ?? process.cwd(),
);
const record: string = path.join(
  humanViewerStorage(root, process.env.HUMAN_VIEWER_STORAGE_ROOT),
  instance.record,
);
const PROBE_MS: number = 2000;
let health: IHumanShotHealth | null | undefined;
try {
  const response: Response = await fetch(instance.origin + "/health", {
    signal: AbortSignal.timeout(PROBE_MS),
  });
  const body: IHumanShotHealth = (await response.json()) as IHumanShotHealth;
  health = body.service === "automovie-human-viewer" ? body : undefined;
} catch (error) {
  health = humanViewerErrorCode(error) === "ECONNREFUSED" ? null : undefined;
}
if (
  health !== null &&
  health !== undefined &&
  process.env.HUMAN_VIEWER_STORAGE_ROOT &&
  health.storage !==
    humanViewerStorage(root, process.env.HUMAN_VIEWER_STORAGE_ROOT)
)
  throw new Error(
    `Port ${instance.port} does not serve the selected viewer storage; it reports ${health.storage ?? "no storage identity"}`,
  );
const saved: IHumanViewerRecord | null = fs.existsSync(record)
  ? (JSON.parse(fs.readFileSync(record, "utf8")) as IHumanViewerRecord)
  : null;
const plan: HumanViewerControlPlan = planHumanViewerControl(
  command,
  health,
  saved,
);
if (plan.action === "report" && (health === null || health === undefined)) {
  let alive: boolean = false;
  if (saved !== null)
    try {
      process.kill(saved.pid, 0);
      alive = true;
    } catch {
      alive = false;
    }
  const silence: IHumanViewerSilence = describeHumanViewerSilence({
    refused: health === null,
    port: instance.port,
    probeMs: PROBE_MS,
    recordedPid: saved?.pid ?? null,
    recordedAlive: alive,
  });
  console.log(JSON.stringify(silence));
  process.exitCode = silence.answer === "absent" ? 3 : 4;
} else if (plan.action === "report") {
  console.log(JSON.stringify(health ?? { ready: false }));
  process.exitCode =
    health?.protocol === humanViewerProtocol ? plan.exitCode : 3;
} else if (plan.action === "absent") console.log("human-viewer absent");
else if (plan.action === "refuse") {
  console.error(plan.reason);
  process.exitCode = 1;
} else {
  if (saved?.port !== instance.port)
    throw new Error("The process record belongs to another port; stop refused");
  if (!saved?.processStartedAt)
    throw new Error(
      "The process record lacks a creation identity; stop refused",
    );
  ProcessOwnership.stop(plan.pid, saved.processStartedAt);
  // A replacement may own the port now; it alone replaces the stale record.
  console.log("stopped " + plan.pid);
}
