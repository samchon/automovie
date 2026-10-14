import type { ChildProcess } from "node:child_process";

import type { IHumanShotContext } from "./IHumanShotContext.js";
import { probeHumanViewer } from "./probeHumanViewer.js";

/**
 * Wait until this client's own starting server, or an already running one, is ready, then print its health and, when this client started it, stay attached until it exits so the session keeps owning it. An owned server that exits or reports a source failure fails with the actual cause. An answering preparation has no overall deadline. An unanswered health probe never establishes process death or authorizes terminating valid work.
 *
 * @evidence contracts/common.md#principled-implementation Repeated health probes wait for readiness while explicitly checking only the client's owned child's exit and reported source failure; unanswered health remains uncertainty rather than death proof.
 * @evidence contracts/common.md#clear-and-simple-design Probe interpretation stays with probeHumanViewer, while this client owner handles readiness waiting and attachment to its launched child.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No overall timeout converts slow valid preparation into process termination; the post-ready exit check also avoids waiting for an event that already occurred.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes owned versus existing servers, pre-ready failures, post-ready attachment and the absence of a preparation deadline.
 * @evidence contracts/performance.md#efficient-algorithms One health probe runs at a time with a 200 ms pause between incomplete answers; waiting has constant retained state and no accumulated polling tasks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Health and child liveness change over time, so readiness cannot reuse an old unanswered probe as a permanent result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The loop awaits each probe/timer before another and attaches at most one owned-child exit listener; a server that never becomes ready or exits may keep this client pending without a deadline.
 */
export async function awaitHumanViewerReady(
  context: IHumanShotContext,
  owned: ChildProcess | undefined,
): Promise<void> {
  let probe: Awaited<ReturnType<typeof probeHumanViewer>> =
    await probeHumanViewer(context);
  while (!probe.health?.ready) {
    if (
      owned !== undefined &&
      (owned.exitCode !== null || owned.signalCode !== null)
    )
      throw new Error(
        `The owned viewer exited with code ${owned.exitCode} signal ${owned.signalCode} before readiness; its output is in ${context.logFile}`,
      );
    if (
      probe.health?.sourceError !== null &&
      probe.health?.sourceError !== undefined
    )
      throw new Error(
        `The viewer reported a startup/source failure: ${probe.health.sourceError}; output is in ${context.logFile}`,
      );
    await new Promise<undefined>(
      (resolve: (value: undefined | PromiseLike<undefined>) => void): void => {
        setTimeout((): void => resolve(undefined), 200);
      },
    );
    probe = await probeHumanViewer(context);
  }
  console.log(JSON.stringify(probe.health));
  // The final health response can arrive after the child already exited.
  // Match the existing post-ready exit completion without awaiting a past event.
  if (
    owned !== undefined &&
    owned.exitCode === null &&
    owned.signalCode === null
  )
    await new Promise<undefined>(
      (resolve: (value: undefined | PromiseLike<undefined>) => void): void => {
        owned.once("exit", (): void => resolve(undefined));
      },
    );
}
