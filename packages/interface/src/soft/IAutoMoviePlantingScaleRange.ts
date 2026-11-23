import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Per-axis scale range sampled for cluster members. */
export interface IAutoMoviePlantingScaleRange {
  /** Minimum per-axis scale; each strictly positive. */
  min: IAutoMovieVector3;

  /** Maximum per-axis scale; each at least the matching minimum. */
  max: IAutoMovieVector3;
}
