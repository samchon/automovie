import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One child branch's placement in its parent's frame.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `IAutoMoviePlantingChild` as the portable data boundary for the interior plant placement state requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingChild` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingChild {
  /**
   * Stable child identity within the structure.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `id` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `id` for the interior space soft furnishing planting system contract.
   */
  id: string;

  /**
   * Direction in the parent's frame, non-zero and need not be unit. `+y` is the
   * parent's own growth axis; `+x` and `+z` are a deterministic perpendicular
   * pair derived from that axis alone, so the same child vector means the same
   * thing wherever the parent points.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `direction` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `direction` for the interior space soft furnishing planting system contract.
   */
  direction: IAutoMovieVector3;

  /**
   * Where along the parent it emerges, in `[0, 1]` of the parent's length.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `offset` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `offset` for the interior space soft furnishing planting system contract.
   */
  offset: number;
}
