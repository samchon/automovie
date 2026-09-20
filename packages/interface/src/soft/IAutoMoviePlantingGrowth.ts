/**
 * How far along its branching law a plant has actually grown.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `IAutoMoviePlantingGrowth` as the portable data boundary for the interior plant placement state requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingGrowth` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingGrowth {
  /**
   * Growth state in `[0, 1]`. `0` is a plant that has not emerged at all and
   * emits nothing; `1` is the fully extended structure.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `stage` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `stage` for the interior space soft furnishing planting system contract.
   */
  stage: number;

  /**
   * Delay between consecutive levels, in `[0, 1)`. Level `l` starts extending
   * at `stage = onset * l`, so a young plant is a trunk with stubs and an old
   * one carries every order of branching. `onset * (levels − 1)` must stay
   * below `1`, or the deepest level could never emerge.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `onset` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `onset` for the interior space soft furnishing planting system contract.
   */
  onset: number;
}
