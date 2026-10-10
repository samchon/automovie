import type { ChildProcess } from "node:child_process";

import type { IHumanShotContext } from "./IHumanShotContext";
import { probeHumanViewer } from "./probeHumanViewer";

/**
 * Wait until this client's own starting server, or an already running one,
 * is ready, then print its health and, when this client started it, stay
 * attached until it exits so the session keeps owning it. An owned server
 * that exits or reports a source failure fails with the actual cause. An
 * answering preparation has no overall deadline. The existing ten-minute
 * silence boundary applies only while no complete health answer arrives.
 *
 * @evidence contracts/common.md#principled-implementation Readiness comes from the server's own health; the owner stays attached to its child.
 * @evidence contracts/common.md#meaningful-documentation States the attachment and the failure causes.
 */
export async function awaitHumanViewerReady(
  context: IHumanShotContext,
  owned: ChildProcess | undefined,
): Promise<void> {
  let probe = await probeHumanViewer(context);
  let silentSince: number | null = null;
  while (!probe.health?.ready) {
    if (owned !== undefined &&
        (owned.exitCode !== null || owned.signalCode !== null))
      throw new Error(
        `The owned viewer exited with code ${owned.exitCode} signal ${owned.signalCode} before readiness; its output is in ${context.logFile}`,
      );
    if (probe.health?.sourceError !== null &&
        probe.health?.sourceError !== undefined)
      throw new Error(
        `The viewer reported a startup/source failure: ${probe.health.sourceError}; output is in ${context.logFile}`,
      );
    if (probe.health === null || probe.health === undefined) {
      silentSince ??= Date.now();
      if (Date.now() - silentSince >= 600000)
        throw new Error(
          `The viewer stopped answering health before readiness (last probe: ${probe.failure}); output is in ${context.logFile}`,
        );
    } else silentSince = null;
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    probe = await probeHumanViewer(context);
  }
  console.log(JSON.stringify(probe.health));
  // The final health response can arrive after the child already exited.
  // Match the existing post-ready exit completion without awaiting a past event.
  if (owned !== undefined && owned.exitCode === null && owned.signalCode === null)
    await new Promise<undefined>((resolve) => {
      owned.once("exit", () => resolve(undefined));
    });
}
