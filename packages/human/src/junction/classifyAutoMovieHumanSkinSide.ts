import { IAutoMovieHumanSkinDomain } from "./IAutoMovieHumanSkinDomain";

/**
 * Classify a source face against its own authored pad-facing half-section.
 *
 * Positive values face the source's named palmar/plantar pad; negative values face its dorsum. The producer supplies these cosines before atlas packing and mirror placement. A face spanning both sides remains unknown and is conservatively excluded from ordinary pits and engineering marks. Explicit null means an unclassified source transition and excludes the whole face, even beside known corners. NaN is reserved for a true cap apex with no turn; its finite neighbors decide. The 1e-10 tolerance covers cosine roundoff at a source side meridian. This half-section convention is not a measured glabrous transition or a pigment mask. Palmar/plantar skin requires distinct ridge/eccrine microstructure (https://pmc.ncbi.nlm.nih.gov/articles/PMC6328512/), rather than ordinary follicular pits. No density or ridge dimensions are inferred from that study.
 */
export function classifyAutoMovieHumanSkinSide(
  sides: readonly (number | null)[],
): IAutoMovieHumanSkinDomain.Role {
  if (sides.some((side: number | null): boolean => side === null))
    return "unknown";
  const known: number[] = sides.filter(
    (side: number | null): side is number =>
      side !== null && Number.isFinite(side),
  );
  if (known.length === 0) return "unknown";
  const lo: number = Math.min(...known);
  const hi: number = Math.max(...known);
  if (lo >= -1e-10 && hi > 1e-10) return "glabrous";
  if (hi <= 1e-10 && lo < -1e-10) return "ordinary";
  return "unknown";
}
