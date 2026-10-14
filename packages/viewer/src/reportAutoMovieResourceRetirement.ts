import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Report completed retirement causes synchronously, without opening another settlement window. The existing restoration policy owns cause order and identity; this reporter supplies readable aggregate descriptions to callers whose status transport displays Error.message. Opaque empty aggregates and a sole primary cause retain their actual original object.
 *
 * @evidence contracts/common.md#principled-implementation Runs the shared synchronous retirement collector and gives its nonopaque aggregate a readable message while retaining ordered original causes and sole/primary error identity.
 * @evidence contracts/common.md#clear-and-simple-design Diagnostic presentation stays separate from owner fan-out and settlement; one private safe description helper cannot replace an unprintable original cause.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty, cyclic or uninspectable aggregates stay opaque original failures, and refused error inspection is not normalized to successful retirement or allowed to mask the original thrown value.
 * @evidence contracts/common.md#meaningful-documentation Documents completed synchronous reporting, original cause/order, message-only transports and opaque/single primary identity.
 * @evidence contracts/performance.md#efficient-algorithms Collector work scales with operations and aggregate entries; description joins scale with actual message bytes and no new asynchronous settlement window is opened.
 * @evidence contracts/performance.md#reuse-equivalent-work Reporting uses the completed owner failures rather than retrying their resource operations, while original cause objects are reused in the reported aggregate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only temporary cause/message arrays and the thrown diagnostic survive the call; owners retain uncertain resources and this reporter acquires no handle or cleanup task.
 */
export function reportAutoMovieResourceRetirement(
  reporting: readonly (() => void)[],
  primary?: { error: unknown },
): void {
  try {
    if (primary === undefined) restoreAutoMovieRenderModeState(reporting);
    else restoreAutoMovieRenderModeState(reporting, primary);
  } catch (error) {
    let causes: unknown[] | undefined;
    try {
      if (error instanceof AggregateError && error !== primary?.error) {
        const values: unknown = error.errors;
        if (Array.isArray(values) && values.length !== 0) causes = Array.from(values as unknown[]);
      }
    } catch { throw error; }
    if (causes === undefined) throw error;
    throw new AggregateError(
      causes,
      "Resource retirement failed: " + causes.map((cause: unknown): string =>
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
