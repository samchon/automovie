import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/** One convex face-local area a pattern must leave uncovered. */
export interface IAutoMoviePatternExclusion {
  /** Stable exclusion id, unique inside one pattern. */
  id: string;
  /** Convex face-local polygon of at least three points. */
  polygon: IAutoMoviePatternPoint[];
}
