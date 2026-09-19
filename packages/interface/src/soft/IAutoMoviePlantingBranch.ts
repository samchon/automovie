import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One tapered branch segment.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `IAutoMoviePlantingBranch` as the portable data boundary for the interior plant placement state requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingBranch` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingBranch {
  /**
   * Stable branch identity, derived from the path of child ids that made it.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `id` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `id` for the interior space soft furnishing planting system contract.
   */
  id: string;

  /**
   * Id of the branch this one emerges from, or `null` for the trunk.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `parent` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `parent` for the interior space soft furnishing planting system contract.
   */
  parent: string | null;

  /**
   * Recursion level; `0` is the trunk.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `level` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `level` for the interior space soft furnishing planting system contract.
   */
  level: number;

  /**
   * Recipe-frame position of the base.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `start` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `start` for the interior space soft furnishing planting system contract.
   */
  start: IAutoMovieVector3;

  /**
   * Recipe-frame position of the tip, after growth and pruning.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `end` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `end` for the interior space soft furnishing planting system contract.
   */
  end: IAutoMovieVector3;

  /**
   * Radius in metres at the base.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `radiusStart` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `radiusStart` for the interior space soft furnishing planting system contract.
   */
  radiusStart: number;

  /**
   * Radius in metres at the tip.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `radiusEnd` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `radiusEnd` for the interior space soft furnishing planting system contract.
   */
  radiusEnd: number;

  /**
   * Whether the pruning envelope cut this segment short.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `pruned` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `pruned` for the interior space soft furnishing planting system contract.
   */
  pruned: boolean;
}
