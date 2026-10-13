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
 * @evidence contracts/common.md#principled-implementation A convex polygon so it intersects each convex piece by Sutherland-Hodgman clipping; because exclusions may not overlap, a piece's removed area is the plain sum of its clipped intersections.
 * @evidence contracts/common.md#clear-and-simple-design Pattern-wide rather than per zone, because an opening or drain cuts whichever zone it lies in.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-convex hole must be authored as several convex exclusions; the engine neither repairs an outline nor subtracts it from a piece, since the convex kernel has no boolean difference.
 * @evidence contracts/common.md#meaningful-documentation States the zone scope, the convexity, uniqueness and overlap refusals, and how a reached piece reports what it lost.
 * @evidenceExclude contracts/performance.md#cost-and-resources A polygon the engine canonicalizes once per run and reuses for every zone and piece; it compares exclusion pairs quadratically, clips each surviving piece against every exclusion, and drops the hull copies when the run returns.
 * @author Samchon
 */
export interface IAutoMoviePatternExclusion {
  /** Stable exclusion id, unique inside one pattern. */
  id: string;

  /** Convex face-local polygon of at least three non-collinear points. */
  polygon: IAutoMoviePatternPoint[];
}
