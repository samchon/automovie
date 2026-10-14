import type { ChildProcess } from "node:child_process";

import type { IHumanShotContext } from "./IHumanShotContext.js";
import { planHumanViewerWatch } from "./planHumanViewerWatch.js";
import { probeHumanViewer } from "./probeHumanViewer.js";
import { launchHumanViewerServer } from "./launchHumanViewerServer.js";

/**
 * Probe the viewer from outside its process and apply the existing watch plan: leave an answering server alone and start only after a refused port and an ended own child. Slow or unanswered probes never kill a process. SIGINT/SIGTERM withdraw this loop so the launcher's captured-identity child-stop handler cannot be followed by an automatic restart. Return after the current probe/pause settles and remove this watcher's signal bindings; the launcher owns child termination and log closure.
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing probe/plan policy to launch only after absence and an ended own child, and a client stop signal withdraws the loop so its launcher's stopped child is not restarted.
 * @evidence contracts/common.md#clear-and-simple-design The watcher owns probe iteration and its stop flag while launchHumanViewerServer owns captured child termination, output pipes and its child signal bindings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Slow/unanswered probes never kill or replace a process, answering foreign servers are left alone and stop signals do not become an immediate restart request.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies outside-process supervision, original child ownership, probe refusal policy and return after client stop.
 * @evidence contracts/performance.md#efficient-algorithms One probe and fixed plan precede the existing three-second pause; one own child is retained and no probe history or parallel restart queue accumulates.
 * @evidence contracts/performance.md#reuse-equivalent-work A running answering server is reused as observed service state; a new launcher is a distinct owned effect and never shares another watcher's creation identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The watcher removes its own signal listeners on return/failure and awaits each probe/pause; the launcher owns actual child stop/log closure, and an unanswered probe's duration remains its transport owner's responsibility.
 */
export async function watchHumanViewer(
  context: IHumanShotContext,
): Promise<void> {
  let owned: ChildProcess | undefined;
  let stopping: boolean = false;
  const stop: () => void = (): void => { stopping = true; };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const pause: (ms: number) => Promise<undefined> = (ms: number): Promise<undefined> =>
    new Promise<undefined>((resolve: (value: undefined) => void): void => {
      setTimeout((): void => resolve(undefined), ms);
    });
  const health: () => Promise<Awaited<ReturnType<typeof probeHumanViewer>>["health"]> = async (): Promise<Awaited<ReturnType<typeof probeHumanViewer>>["health"]> => {
    try {
      return (await probeHumanViewer(context)).health;
    } catch {
      return undefined;
    }
  };
  try {
  while (!stopping) {
    const answer: Awaited<ReturnType<typeof health>> = await health();
    if (stopping) return;
    const answered: boolean = answer?.service !== undefined;
    const plan: ReturnType<typeof planHumanViewerWatch> = planHumanViewerWatch({
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
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
}
