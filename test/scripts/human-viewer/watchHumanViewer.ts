import type { ChildProcess } from "node:child_process";
import fs from "node:fs";

import type { IHumanShotContext } from "./IHumanShotContext";
import { killHumanViewerProcess } from "./killHumanViewerProcess";
import { planHumanViewerWatch } from "./planHumanViewerWatch";
import { probeHumanViewer } from "./probeHumanViewer";
import { startHumanViewerServer } from "./startHumanViewerServer";

/** Silence after which the watcher's own server counts as hung, in milliseconds. */
const HANG_MS = 600000;

/**
 * Keep the viewer alive from outside its process. `planHumanViewerWatch`
 * decides from the probe and the watcher's own child: an answering server is
 * left alone, a refused port gets a server, and only the watcher's own child
 * is restarted after `HANG_MS` of silence. A restart kills that child and
 * waits until the port is free before the new server starts, so two servers
 * never contend for it. The watcher owns the started server as a child, so
 * stopping the watcher stops it. It never returns.
 *
 * @evidence contracts/common.md#principled-implementation Ownership of the child process, not the record file, decides every kill.
 * @evidence contracts/common.md#meaningful-documentation States the start, restart and ownership rules.
 */
export async function watchHumanViewer(
  context: IHumanShotContext,
): Promise<void> {
  let owned: ChildProcess | undefined;
  let silentSince: number | null = null;
  const pause = (ms: number) =>
    new Promise<undefined>((resolve) => {
      setTimeout(resolve, ms);
    });
  const health = async () => {
    try {
      return (await probeHumanViewer(context)).health;
    } catch {
      return undefined;
    }
  };
  for (;;) {
    const answer = await health();
    const answered = answer?.service !== undefined;
    silentSince = answered ? null : (silentSince ?? Date.now());
    const plan = planHumanViewerWatch({
      answered,
      refused: answer === null,
      ownedRunning: owned !== undefined && owned.exitCode === null,
      silentMs: silentSince === null ? 0 : Date.now() - silentSince,
      limitMs: HANG_MS,
    });
    if (plan === "start") {
      console.error("watch: no server, starting");
      owned = startHumanViewerServer(context);
      silentSince = Date.now() + 180000;
    } else if (plan === "restart") {
      console.error(
        "watch: own server silent for " + HANG_MS / 1000 + " s, restarting",
      );
      if (owned?.pid) killHumanViewerProcess(owned.pid);
      fs.rmSync(context.record, { force: true });
      // The port is released only when the old process is gone.
      for (let wait = 0; wait < 30 && (await health()) !== null; ++wait)
        await pause(1000);
      owned = startHumanViewerServer(context);
      silentSince = Date.now() + 180000;
    }
    await pause(3000);
  }
}
