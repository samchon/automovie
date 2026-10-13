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
 * @author Samchon
 */
export interface IAutoMoviePatternExclusion {
  /** Stable exclusion id, unique inside one pattern. */
  id: string;

  /** Convex face-local polygon of at least three non-collinear points. */
  polygon: IAutoMoviePatternPoint[];
}
