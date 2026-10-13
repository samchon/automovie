import type { IAutoMovieVector3 } from "@automovie/interface";

/** One hard anchor target resolved on the soft solver's fixed step. */
export interface IAutoMovieSoftBodyResolvedAnchor {
  /** Anchored row-major particle index. */
  particle: number;
  /** World-space target sampled for this step. */
  position: IAutoMovieVector3;
}
