import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** The per-axis scale range cluster members are drawn from. */
export interface IAutoMoviePlantingScaleRange {
  /** Minimum per-axis scale; each strictly positive. */
  min: IAutoMovieVector3;

  /** Maximum per-axis scale; each at least the matching minimum. */
  max: IAutoMovieVector3;
}
