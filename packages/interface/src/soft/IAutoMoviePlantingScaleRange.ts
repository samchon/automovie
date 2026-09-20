import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The per-axis scale range cluster members are drawn from.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IAutoMoviePlantingScaleRange` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingScaleRange` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingScaleRange {
  /**
   * Minimum per-axis scale; each strictly positive.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `min` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `min` for the interior space soft furnishing planting system contract.
   */
  min: IAutoMovieVector3;

  /**
   * Maximum per-axis scale; each at least the matching minimum.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `max` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `max` for the interior space soft furnishing planting system contract.
   */
  max: IAutoMovieVector3;
}
