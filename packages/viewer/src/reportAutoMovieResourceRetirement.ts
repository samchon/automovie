import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Report completed retirement causes synchronously, without opening another settlement window. The existing restoration policy owns cause order and identity; this reporter supplies aggregate descriptions to callers whose status transport displays Error.message. Opaque empty aggregates and a sole primary cause retain their original object. Description expects an Error's message to be a string: an invalid runtime message with throwing string coercion can still replace the aggregate during the final join.
 *
 * @evidence contracts/common.md#principled-implementation Runs the shared synchronous retirement collector and, when diagnostic string conversion succeeds, gives its nonopaque aggregate a message retaining ordered original causes. Sole/primary error identity follows the collector; string conversion is not part of resource retirement.
 * @evidence contracts/common.md#clear-and-simple-design Diagnostic presentation stays separate from owner fan-out and settlement; the private description helper catches inspection failure, while final message joining remains outside that helper's boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty, cyclic or uninspectable aggregates remain opaque causes under the collector policy, and a refused message getter yields fallback text. A nonstring Error.message whose coercion throws during join remains an unresolved original-cause preservation gap; no successful retirement is inferred from diagnostic presentation.
 * @evidence contracts/common.md#meaningful-documentation Documents synchronous reporting, original cause/order, message-only transports, opaque/single primary identity and the unresolved runtime message-coercion boundary.
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
