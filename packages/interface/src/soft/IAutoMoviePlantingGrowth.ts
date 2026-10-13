/**
 * Static growth stage and inter-level onset delay for a deterministic planting recipe.
 *
 * @evidence contracts/common.md#principled-implementation Level extension clamps stage minus onset times level over the positive final-level growth span; zero stage emits nothing and full stage reaches every admitted level.
 * @evidence contracts/common.md#clear-and-simple-design Two unitless scalars express authored growth state without a time integration model or species-specific maturation table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Onset times deepest level must remain below one so no declared branch order is permanently unreachable; invalid spans refuse rather than being clamped into a different growth law.
 * @evidence contracts/common.md#meaningful-documentation Defines closed-unit stage, onset range, emergence formula and positive deepest-level span.
 * @author Samchon
 */
export interface IAutoMoviePlantingGrowth {
  /**
   * Growth state in `[0, 1]`. `0` is a plant that has not emerged at all and emits nothing; `1` is the fully extended structure.
   */
  stage: number;

  /**
   * Delay between consecutive levels, in `[0, 1)`. Level `l` starts extending at `stage = onset * l`, so a young plant is a trunk with stubs and an old one carries every order of branching. `onset * (levels − 1)` must stay below `1`, or the deepest level could never emerge.
   */
  onset: number;
}
