/**
 * Half-extent of a placement rectangle on the ground plane.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `IAutoMoviePlantingExtent` as the portable data boundary for the interior plant placement state requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingExtent` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingExtent {
  /**
   * Half-extent along world `x` in metres; `>= 0`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `x` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `x` for the interior space soft furnishing planting system contract.
   */
  x: number;

  /**
   * Half-extent along world `z` in metres; `>= 0`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `z` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `z` for the interior space soft furnishing planting system contract.
   */
  z: number;
}
