import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/*
 * Report completed retirement causes synchronously, without opening another
 * settlement window. The existing restoration policy owns cause order and
 * identity; this reporter supplies aggregate descriptions to callers whose
 * status transport displays Error.message. Opaque empty aggregates and a sole
 * primary cause retain their original object. Description expects an Error's
 * message to be a string: an invalid runtime message with throwing string
 * coercion can still replace the aggregate during the final join.
 */
export function reportAutoMovieResourceRetirement(
  reporting: readonly (() => void)[],
  primary?: { error: unknown },
): void {
  try {
    if (primary === undefined) restoreAutoMovieRenderModeState(reporting);
    else restoreAutoMovieRenderModeState(reporting, primary);
  } catch (error) {
    const causes: unknown[] | undefined =
      error instanceof AggregateError &&
      error !== primary?.error &&
      error.errors.length !== 0
        ? [...error.errors]
        : undefined;
    if (causes === undefined) throw error;
    throw new AggregateError(
      causes,
      "Resource retirement failed: " +
        causes.map((cause: unknown): string => describeCause(cause)).join("; "),
    );
  }
}

/*
 * A diagnostic description must not replace an original unprintable cause.
 */
function describeCause(cause: unknown): string {
  try {
    return cause instanceof Error ? cause.message : String(cause);
  } catch {
    return "Unprintable retirement cause";
  }
}
