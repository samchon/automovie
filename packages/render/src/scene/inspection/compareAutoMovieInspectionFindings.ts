import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

/**
 * Order two observations of one finding identity by how bad their evidence is.
 *
 * Confidence orders first, a confirmed observation above a candidate; then
 * category, an error above any other; then the checker's rank, larger worse,
 * with an absent rank below every present one. Rank is compared only among
 * findings of the same identity, as `IAutoMovieInspectionDiagnostics.IWitness`
 * states, so callers pass two observations of one identity.
 *
 * @param current The observation being placed.
 * @param previous The observation it is compared with.
 * @returns A positive number when `current` is worse, a negative number when it
 *   is better, and zero when neither is.
 */
export function compareAutoMovieInspectionFindings(
  current: IAutoMovieInspectionDiagnostics.IFinding,
  previous: IAutoMovieInspectionDiagnostics.IFinding,
): number {
  if (current.confidence !== previous.confidence)
    return current.confidence === "confirmed" ? 1 : -1;
  if ((current.category === "error") !== (previous.category === "error"))
    return current.category === "error" ? 1 : -1;
  const now: number = current.witness.rank ?? -Infinity;
  const before: number = previous.witness.rank ?? -Infinity;
  return now > before ? 1 : now < before ? -1 : 0;
}
