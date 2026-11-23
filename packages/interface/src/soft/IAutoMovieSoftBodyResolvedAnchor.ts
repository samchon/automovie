import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One hard target in a complete softBodyBoundarySample, resolved at an absolute
 * step.
 */
export interface IAutoMovieSoftBodyResolvedAnchor {
  /** Anchored row-major particle index. */
  particle: number;

  /** World-space target sampled for this step. */
  position: IAutoMovieVector3;
}
