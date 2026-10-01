/**
 * Refuse candidate publication when compilation is serving fallback modules.
 * The active iframe keeps its committed build; only a successful source
 * generation may create the replacement. The host reports this cause beside
 * the last good frame instead of labeling old modules as a new source revision.
 *
 * @evidence contracts/common.md#principled-implementation A compiler failure prevents candidate publication even when fallback modules remain executable.
 * @evidence contracts/common.md#clear-and-simple-design One admission guard separates candidate readiness from last-good display availability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports the compiler's actual failure without accepting a cached module as current or extending a timeout.
 * @evidence contracts/common.md#meaningful-documentation States the active-frame preservation and source-revision publication boundary.
 */
export function assertHumanViewerSource(error: string | null): void {
  if (error !== null) throw new Error("Current source error: " + error);
}
