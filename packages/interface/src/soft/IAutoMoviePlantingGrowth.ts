/** How far along its branching law a plant has actually grown. */
export interface IAutoMoviePlantingGrowth {
  /**
   * Growth state in `[0, 1]`. `0` is a plant that has not emerged at all and
   * emits nothing; `1` is the fully extended structure.
   */
  stage: number;

  /**
   * Delay between consecutive levels, in `[0, 1)`. Level `l` starts extending
   * at `stage = onset * l`, so a young plant is a trunk with stubs and an old
   * one carries every order of branching. `onset * (levels − 1)` must stay
   * below `1`, or the deepest level could never emerge.
   */
  onset: number;
}
