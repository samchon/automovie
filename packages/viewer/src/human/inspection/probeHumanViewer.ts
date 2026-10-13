import type { IHumanShotContext } from "./IHumanShotContext.js";
import type { IHumanShotHealth } from "./IHumanShotHealth.js";
import type { IHumanViewerProbe } from "./IHumanViewerProbe.js";
import { describeHumanViewerError } from "./describeHumanViewerError.js";
import { humanViewerErrorCode } from "./humanViewerErrorCode.js";
import { humanViewerProtocol } from "./humanViewerProtocol.js";

/**
 * Ask the port for health. A refused connection is an absent viewer (null).
 * Any other failure to get a complete answer, a timeout, a reset or a cut
 * body while the server starts or restarts, is an unanswered port
 * (undefined): something listens, and the caller waits rather than starting
 * or killing anything. Only an answering foreign program is an error.
 *
 * @evidence contracts/common.md#principled-implementation The connection outcome, not elapsed time alone, separates absent from unanswered.
 * @evidence contracts/common.md#clear-and-simple-design One health probe supplies connection classification and verifies service protocol and selected storage before returning its answer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A timed-out or malformed response remains unanswered; it never authorizes killing a listener or substituting a different viewer session.
 * @evidence contracts/common.md#meaningful-documentation States the three outcomes and the error.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The connection outcome, not elapsed time alone, separates absent from unanswered.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform One health probe supplies connection classification and verifies service protocol and selected storage before returning its answer.
 */
export async function probeHumanViewer(
  context: IHumanShotContext,
): Promise<IHumanViewerProbe> {
  let text: string;
  try {
    const response = await fetch(context.origin + "/health", {
      signal: AbortSignal.timeout(context.probeMs),
    });
    text = await response.text();
  } catch (error) {
    return {
      health: humanViewerErrorCode(error) === "ECONNREFUSED" ? null : undefined,
      failure: describeHumanViewerError(error),
    };
  }
  let health: IHumanShotHealth;
  try {
    health = JSON.parse(text) as IHumanShotHealth;
  } catch {
    return {
      health: undefined,
      failure: `/health answered ${text.length} bytes that are not JSON`,
    };
  }
  if (health?.service !== "automovie-human-viewer")
    throw new Error(`Port ${context.port} belongs to another program`);
  if (health.protocol !== humanViewerProtocol)
    throw new Error(
      `Port ${context.port} runs viewer protocol ${health.protocol ?? "legacy"}; this client requires ${humanViewerProtocol}. Start this session's viewer from current source on a free port; do not restart another session's server.`,
    );
  if (
    process.env.HUMAN_VIEWER_STORAGE_ROOT &&
    health.storage !== context.storage
  )
    throw new Error(
      `Port ${context.port} does not serve the selected viewer storage ${context.storage}; it reports ${health.storage ?? "no storage identity"}`,
    );
  return { health, failure: "" };
}
