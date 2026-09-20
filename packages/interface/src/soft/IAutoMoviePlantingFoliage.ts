import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The leaf rule.
 *
 * Leaves are emitted as full-TRS instance occurrences — translation, unit
 * quaternion and per-axis scale — because that is exactly what GPU instancing
 * consumes without loss. A leaf is never a degraded yaw or a uniform scale.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IAutoMoviePlantingFoliage` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingFoliage` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingFoliage {
  /**
   * Leaves per metre of bearing branch; strictly positive.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `density` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `density` for the interior space soft furnishing planting system contract.
   */
  density: number;

  /**
   * Lowest branch level that bears leaves; an integer `>= 0`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `minLevel` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `minLevel` for the interior space soft furnishing planting system contract.
   */
  minLevel: number;

  /**
   * Prototype leaf size in metres on each local axis; each strictly positive.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `size` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `size` for the interior space soft furnishing planting system contract.
   */
  size: IAutoMovieVector3;

  /**
   * Seeded relative perturbation of leaf size, in `[0, 1)`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `scaleJitter` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `scaleJitter` for the interior space soft furnishing planting system contract.
   */
  scaleJitter: number;

  /**
   * Seeded roll about the bearing branch, in `[0, 1]`. `0` leaves every blade
   * in the branch's own frame; `1` spins each one anywhere around it.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `rollJitter` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `rollJitter` for the interior space soft furnishing planting system contract.
   */
  rollJitter: number;
}
