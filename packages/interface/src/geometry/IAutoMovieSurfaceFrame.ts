import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Metre centroid and orienting directions for one rigid surface sample.
 *
 * The direction magnitudes leave the prepared triangle's size unchanged. A zero
 * or represented parallel basis is refused.
 */
export interface IAutoMovieSurfaceFrame {
  /**
   * Finite centroid in the caller's metre frame. Placement puts the prepared
   * sample's centre here.
   */
  readonly origin: Readonly<IAutoMovieVector3>;

  /**
   * Finite nonzero heading direction. Its projection into the normal's plane
   * defines the first axis and must remain nonzero.
   */
  readonly forward: Readonly<IAutoMovieVector3>;

  /**
   * Finite nonzero oriented plane normal. Its magnitude has no effect on
   * placement scale.
   */
  readonly normal: Readonly<IAutoMovieVector3>;
}
