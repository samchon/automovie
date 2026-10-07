import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake";

/**
 * Cycles one unit has turned over, and the take it is performing now.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Carries the selected take and the translation and radius-scaled turn accumulators used to position every member in its cycle.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Carries the selected take and the translation and radius-scaled turn accumulators used to position every member in its cycle.
 * @author Samchon
 */
export interface IAutoMovieFormationCadence {
  /**
   * Take playing at the sampled time.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Selects the gait table used for the current accumulated travel and turn response.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Selects the gait table used for the current accumulated travel and turn response.
   */
  take: IAutoMovieFormationCycleTake;

  /**
   * Cycles every member has turned over by the unit's own travel.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Retains the common cycle advance contributed by unit translation.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Retains the common cycle advance contributed by unit translation.
   */
  advance: number;

  /**
   * Cycles per meter of member radius turned over by the unit's turning.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Retains turn cycles per metre of pivot radius for each member arc distance.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Retains turn cycles per metre of pivot radius for each member arc distance.
   */
  turn: number;
}
