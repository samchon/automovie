/**
 * Refuse candidate publication when compilation is serving fallback modules.
 * The active iframe keeps its committed build; only a successful source
 * generation may create the replacement. The host reports this cause beside
 * the last good frame instead of labeling old modules as a new source revision.
 */
export function assertHumanViewerSource(error: string | null): void {
  if (error !== null) throw new Error("Current source error: " + error);
}
