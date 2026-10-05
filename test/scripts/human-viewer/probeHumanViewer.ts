import type { IHumanShotContext } from "./IHumanShotContext";
import type { IHumanShotHealth } from "./IHumanShotHealth";
import type { IHumanViewerProbe } from "./IHumanViewerProbe";
import { describeHumanViewerError } from "./describeHumanViewerError";
import { humanViewerErrorCode } from "./humanViewerErrorCode";

/**
 * Ask the port for health. A refused connection is an absent viewer (null).
 * Any other failure to get a complete answer, a timeout, a reset or a cut
 * body while the server starts or restarts, is an unanswered port
 * (undefined): something listens, and the caller waits rather than starting
 * or killing anything. Only an answering foreign program is an error.
 *
 * @evidence contracts/common.md#principled-implementation The connection outcome, not elapsed time alone, separates absent from unanswered.
 * @evidence contracts/common.md#meaningful-documentation States the three outcomes and the error.
 */
export async function probeHumanViewer(context: IHumanShotContext): Promise<IHumanViewerProbe> {
  let text: string;
  try {
    const response = await fetch(context.origin + "/health", { signal: AbortSignal.timeout(context.probeMs) });
    text = await response.text();
  } catch (error) {
    return { health: humanViewerErrorCode(error) === "ECONNREFUSED" ? null : undefined,
      failure: describeHumanViewerError(error) };
  }
  let health: IHumanShotHealth;
  try {
    health = JSON.parse(text) as IHumanShotHealth;
  } catch {
    return { health: undefined, failure: `/health answered ${text.length} bytes that are not JSON` };
  }
  if (health?.service !== "automovie-human-viewer")
    throw new Error(`Port ${context.port} belongs to another program`);
  return { health, failure: "" };
}
