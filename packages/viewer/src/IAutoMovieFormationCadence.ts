import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake";

/**
 * Cycles one unit has turned over, and the take it is performing now.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
 * @author Samchon
 */
export interface IAutoMovieFormationCadence {
  /**
   * Take playing at the sampled time.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
   */
  take: IAutoMovieFormationCycleTake;

  /**
   * Cycles every member has turned over by the unit's own travel.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
   */
  advance: number;

  /**
   * Cycles per meter of member radius turned over by the unit's turning.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
   */
  turn: number;
}
