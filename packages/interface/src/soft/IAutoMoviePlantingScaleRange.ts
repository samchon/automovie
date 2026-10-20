import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Per-axis scale range sampled for cluster members.
 *
 * @evidence contracts/common.md#principled-implementation arrangePlantingCluster linearly maps seeded samples into each axis interval; validatePlantingCluster requires finite positive minima and maxima no smaller than their corresponding minima.
 * @evidence contracts/common.md#clear-and-simple-design Two vectors expose the three independent intervals without adding a distribution object to the current linear sampling rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal endpoints express fixed scale directly; no species-specific scale or replacement minimum is selected.
 * @evidence contracts/common.md#meaningful-documentation Endpoint comments state positivity and axis-wise ordering; these are dimensionless instance scales rather than lengths.
 */
export interface IAutoMoviePlantingScaleRange {
  /** Minimum per-axis scale; each strictly positive. */
  min: IAutoMovieVector3;

  /** Maximum per-axis scale; each at least the matching minimum. */
  max: IAutoMovieVector3;
}
