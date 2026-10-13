import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Report completed retirement causes synchronously, without opening another
 * settlement window. The existing restoration policy owns cause order and
 * identity; this reporter supplies readable aggregate descriptions to callers
 * whose status transport displays Error.message. Opaque empty aggregates and
 * a sole primary cause retain their actual original object.
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
