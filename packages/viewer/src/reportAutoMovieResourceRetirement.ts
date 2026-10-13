import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Report completed retirement causes synchronously, without opening another
 * settlement window. The existing restoration policy owns cause order and
 * identity; this reporter supplies readable aggregate descriptions to callers
 * whose status transport displays Error.message. Opaque empty aggregates and
 * a sole primary cause retain their actual original object.
 *
 * @evidence contracts/common.md#principled-implementation Reuses restoration's ordered original causes after all independent attempts have completed.
 * @evidence contracts/common.md#clear-and-simple-design One synchronous reporter is shared by individual retirement and scope settlement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports actual causes without retrying owners or inventing successful physical retirement.
 * @evidence contracts/common.md#meaningful-documentation States timing, primary identity and the message-based status consumer.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Reports cleanup failure rather than certifying resource release.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Preserves primary and independent cleanup causes while avoiding a new asynchronous reporting boundary.
 */
export function reportAutoMovieResourceRetirement(
  reporting: readonly (() => void)[],
  primary?: { error: unknown },
): void {
  try {
    if (primary === undefined) restoreAutoMovieRenderModeState(reporting);
    else restoreAutoMovieRenderModeState(reporting, primary);
  } catch (error) {
    if (
      !(error instanceof AggregateError) ||
      error.errors.length === 0 ||
      error === primary?.error
    ) throw error;
    throw new AggregateError(
      error.errors,
      "Resource retirement failed: " + error.errors.map((cause: unknown) =>
        describeCause(cause),
      ).join("; "),
    );
  }
}

/** A diagnostic description must not replace an original unprintable cause. */
function describeCause(cause: unknown): string {
  try {
    return cause instanceof Error ? cause.message : String(cause);
  } catch {
    return "Unprintable retirement cause";
  }
}
