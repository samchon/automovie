import type { ChildProcess } from "node:child_process";

import type { IHumanShotContext } from "./IHumanShotContext";
import { probeHumanViewer } from "./probeHumanViewer";

/**
 * Wait until this client's own starting server, or an already running one,
 * is ready, then print its health and, when this client started it, stay
 * attached until it exits so the session keeps owning it. An owned server
 * that exits first, or a viewer that never becomes ready, fails with the
 * cause and the log path.
 *
 * @evidence contracts/common.md#principled-implementation Readiness comes from the server's own health; the owner stays attached to its child.
 * @evidence contracts/common.md#meaningful-documentation States the attachment and the failure causes.
 */
export async function awaitHumanViewerReady(context: IHumanShotContext, owned: ChildProcess | undefined): Promise<void> {
  let probe = await probeHumanViewer(context);
  for (let attempt = 0; !probe.health?.ready && attempt < 3000; ++attempt) {
    if (owned?.exitCode !== null && owned?.exitCode !== undefined)
      throw new Error(`The owned viewer exited with code ${owned.exitCode} before readiness; its output is in ${context.logFile}`);
    await new Promise((resolve) => { setTimeout(resolve, 200); });
    probe = await probeHumanViewer(context);
  }
  if (!probe.health?.ready)
    throw new Error(`The viewer did not become ready${probe.failure === "" ? "" : " (last probe: " + probe.failure + ")"}`);
  console.log(JSON.stringify(probe.health));
  if (owned !== undefined)
    await new Promise<undefined>((resolve) => { owned.once("exit", () => resolve(undefined)); });
}
