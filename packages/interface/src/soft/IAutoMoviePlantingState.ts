import { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";
import { IAutoMoviePlantingBranch } from "./IAutoMoviePlantingBranch";
import { IAutoMoviePlantingLeaf } from "./IAutoMoviePlantingLeaf";

/**
 * The derived structure of one planting recipe at its authored growth state.
 *
 * A pure function of the recipe. Nothing accumulates between calls, so two
 * derivations of the same record are bit-identical and a plant re-derived in a
 * later chunk of the same render is the same plant.
 *
 * Every coordinate here is in the **recipe's own frame**, with the trunk's base
 * at the origin. That is what makes one derived structure serve a whole bed:
 * the cluster's placements carry the world transforms, and a renderer composes
 * the two. A consumer that read these as world coordinates would draw forty
 * ferns on top of each other at the origin.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `IAutoMoviePlantingState` as the portable data boundary for the interior plant placement state requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingState` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingState {
  /**
   * Identity of the recipe this structure was derived from.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `domain` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `domain` for the interior space soft furnishing planting system contract.
   */
  domain: string;

  /**
   * Growth state the structure was derived at.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `stage` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `stage` for the interior space soft furnishing planting system contract.
   */
  stage: number;

  /**
   * Branch segments in a stable depth-first authored order.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `branches` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `branches` for the interior space soft furnishing planting system contract.
   */
  branches: IAutoMoviePlantingBranch[];

  /**
   * Leaf occurrences, in the order of the branches that bear them.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `leaves` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `leaves` for the interior space soft furnishing planting system contract.
   */
  leaves: IAutoMoviePlantingLeaf[];

  /**
   * Recipe-frame extent of the derived structure, or `null` when nothing
   * emerged at all — a plant at growth state `0`, or one pruned away entirely.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `bounds` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `bounds` for the interior space soft furnishing planting system contract.
   */
  bounds: IAutoMovieSoftBounds | null;
}
