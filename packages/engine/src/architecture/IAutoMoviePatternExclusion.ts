import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One convex face-local area a pattern must leave uncovered.
 *
 * It applies to every zone of the pattern. `generateAutoMovieSurfacePattern`
 * throws when the id is blank or repeated, when the polygon's convex hull does
 * not keep every authored point (a reflex corner, an interior, repeated or
 * collinear point), and when two exclusions overlap by more than `1e-12` m².
 * A piece an exclusion reaches keeps its convex outline; the area it lost is
 * reported as `punchedArea` and as an `unsupported-piece` finding.
 *
 * @evidence contracts/common.md#principled-implementation Canonicalizes the authored point set through its convex hull, refusing dropped points but discarding authored ring order. Binary64 convex clips measure exclusion area; overlaps above `1e-12` m² refuse, while smaller tolerated contacts and rounding can still affect summed subtraction.
 * @evidence contracts/common.md#clear-and-simple-design An id and a polygon are all an exclusion needs; it applies to every zone so an opening crossing a zone border is stated once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A punched piece keeps its convex outline and is reported as an `unsupported-piece` finding rather than handed back as an outline that quietly covers the opening.
 * @evidence contracts/common.md#meaningful-documentation States the scope across zones, every refusal with its overlap tolerance, how a reached piece is reported, the uniqueness of the id and the polygon's convexity requirement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; the run clips each surviving piece against every exclusion, answered on `generateAutoMovieSurfacePattern`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The canonical hull of each exclusion is built once per run and reused for every zone and piece in it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the authored polygon; the run keeps its canonical copy only for the call's duration.
 */
export interface IAutoMoviePatternExclusion {
  /** Stable exclusion id, unique inside one pattern. */
  id: string;

  /** Convex face-local polygon of at least three non-collinear points. */
  polygon: IAutoMoviePatternPoint[];
}
