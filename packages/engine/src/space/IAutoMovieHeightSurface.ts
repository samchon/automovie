import { IAutoMovieHeightRule, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Whatever states how high the ground is: either surface record answers here.
 *
 * A scene's {@link IAutoMovieSurface} and a production world's
 * `IAutoMovieWorldSurface` are two records for one thing, the ground, and both
 * are read by {@link surfaceHeightAt}. Spelled structurally rather than as a
 * union of the two so nothing has to name the world's record to ask its height,
 * and so a caller holding neither — a prepared patch, a projected footprint —
 * can still ask.
 *
 * @author Samchon
 */
export interface IAutoMovieHeightSurface {
  /** The general ground rule, when the surface states one. */
  readonly height?: IAutoMovieHeightRule | undefined;

  /** First height anchor of the two-anchor spelling. */
  readonly anchor?: IAutoMovieVector3 | undefined;

  /** Second height anchor of the two-anchor spelling; `null` when flat. */
  readonly rampTo?: IAutoMovieVector3 | null | undefined;
}
