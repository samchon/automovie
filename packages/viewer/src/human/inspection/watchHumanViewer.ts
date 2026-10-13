import type { ChildProcess } from "node:child_process";

import type { IHumanShotContext } from "./IHumanShotContext.js";
import { planHumanViewerWatch } from "./planHumanViewerWatch.js";
import { probeHumanViewer } from "./probeHumanViewer.js";
import { launchHumanViewerServer } from "./launchHumanViewerServer.js";

/**
 * Keep the viewer alive from outside its process. `planHumanViewerWatch`
 * decides from the probe and the watcher's own child: an answering server is
 * left alone, and a refused port gets a server only after the own child has
 * exited. Slow or unanswered probes never kill a process. The watcher owns
 * the started server as a child, so
 * stopping the watcher stops it. It never returns.
 *
 * @evidence contracts/common.md#principled-implementation Ownership of the child process, not the record file, decides every kill.
 * @evidence contracts/common.md#clear-and-simple-design One watcher delegates its probe, restart predicate and owned-child launch instead of maintaining a second source or graphics service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Starts only on actual refused-port and ended-own-child conditions; slow probes or elapsed polling time never terminate an answering process.
 * @evidence contracts/common.md#meaningful-documentation States the start and ownership rules without a silence deadline.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Ownership of the child process, not the record file, decides every kill.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform One watcher delegates its probe, restart predicate and owned-child launch instead of maintaining a second source or graphics service.
 */
export async function watchHumanViewer(
  context: IHumanShotContext,
): Promise<void> {
  let owned: ChildProcess | undefined;
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
    const plan = planHumanViewerWatch({
      answered,
      refused: answer === null,
      ownedRunning: owned !== undefined && owned.exitCode === null && owned.signalCode === null,
    });
    if (plan === "start") {
      console.error("watch: no server, starting");
      owned = launchHumanViewerServer(context);
    }
    await pause(3000);
  }
}
