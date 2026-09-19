import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePlantingChild } from "./IAutoMoviePlantingChild";

/**
 * The recursive branching law, free of any species classification.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IAutoMoviePlantingStructure` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingStructure` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingStructure {
  /**
   * Recursion depth; an integer of at least 1. Level `0` is the trunk.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `levels` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `levels` for the interior space soft furnishing planting system contract.
   */
  levels: number;

  /**
   * Growth direction of the trunk in world space; non-zero, need not be unit.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `axis` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `axis` for the interior space soft furnishing planting system contract.
   */
  axis: IAutoMovieVector3;

  /**
   * Trunk length in metres at full growth; strictly positive.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `length` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `length` for the interior space soft furnishing planting system contract.
   */
  length: number;

  /**
   * Trunk radius in metres at its base; strictly positive.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `radius` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `radius` for the interior space soft furnishing planting system contract.
   */
  radius: number;

  /**
   * Child length divided by parent length; in `(0, 1]`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `lengthRatio` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `lengthRatio` for the interior space soft furnishing planting system contract.
   */
  lengthRatio: number;

  /**
   * Child radius divided by parent radius; in `(0, 1]`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `radiusRatio` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `radiusRatio` for the interior space soft furnishing planting system contract.
   */
  radiusRatio: number;

  /**
   * The children every branch bears, in authored order. At least one, so the
   * recursion has something to do; the branching pattern of a whole plant is
   * this short list applied at every level.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `children` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `children` for the interior space soft furnishing planting system contract.
   */
  children: IAutoMoviePlantingChild[];

  /**
   * Seeded perturbation of each child's direction, in `[0, 1]`. `0` grows a
   * perfectly regular lattice of a plant; `1` fully randomizes the offset
   * before the direction is renormalized.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `directionJitter` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `directionJitter` for the interior space soft furnishing planting system contract.
   */
  directionJitter: number;

  /**
   * Seeded relative perturbation of each child's length, in `[0, 1)`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `lengthJitter` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `lengthJitter` for the interior space soft furnishing planting system contract.
   */
  lengthJitter: number;

  /**
   * Bias of every child direction toward world vertical, in `[-1, 1]`. Positive
   * droops toward `-y` (a weeping habit, a hanging basket); negative lifts
   * toward `+y` (a columnar habit); `0` follows the authored direction
   * exactly.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `gravitropism` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `gravitropism` for the interior space soft furnishing planting system contract.
   */
  gravitropism: number;
}
