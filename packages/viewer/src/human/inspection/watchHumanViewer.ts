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
