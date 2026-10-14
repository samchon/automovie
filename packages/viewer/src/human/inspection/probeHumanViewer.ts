import type { IHumanShotContext } from "./IHumanShotContext.js";
import type { IHumanShotHealth } from "./IHumanShotHealth.js";
import type { IHumanViewerProbe } from "./IHumanViewerProbe.js";
import { describeHumanViewerError } from "./describeHumanViewerError.js";
import { humanViewerErrorCode } from "./humanViewerErrorCode.js";
import { humanViewerProtocol } from "./humanViewerProtocol.js";

/**
 * Ask the port for health. A refused connection is an absent viewer (null). Any other failure to get a complete answer, a timeout, a reset or a cut body while the server starts or restarts, is an unanswered port (undefined): it supplies no presence or absence proof, and the caller waits rather than starting or killing anything. Only an answering foreign program is an error.
 *
 * @evidence contracts/common.md#principled-implementation One timed health fetch distinguishes ECONNREFUSED absence from incomplete transport answers, then checks answering service/protocol/storage identity.
 * @evidence contracts/common.md#clear-and-simple-design Fetch/JSON parsing and service checks separate unanswered-port classification from foreign-program refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Accepted silence cannot authorize startup or kill, and arbitrary JSON is not sufficient owned health identity.
 * @evidence contracts/common.md#meaningful-documentation The comment describes absence, timeout/reset/body silence and answering-program errors.
 * @evidence contracts/performance.md#efficient-algorithms Network/text/JSON work follows response bytes and the supplied abort timeout bounds the attempt.
 * @evidence contracts/performance.md#reuse-equivalent-work Each probe observes current health while wrapped-code inspection has its own bounded diagnostic traversal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Response bytes and the timeout signal live through the attempt, with no persistent connection, process or watcher acquired.
 */
export async function probeHumanViewer(
  context: IHumanShotContext,
): Promise<IHumanViewerProbe> {
  let text: string;
  try {
    const response: Response = await fetch(context.origin + "/health", {
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
