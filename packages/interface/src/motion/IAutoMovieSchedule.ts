import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/**
 * A composition resolved on the film clock: frozen, ordered entries a renderer,
 * a physics pass or a measurement reads without re-resolving.
 * resolveSchedule freezes the schedule, entries array and individual
 * entry records only. Intent, state, cut records and event arrays are not
 * recursively frozen; intent and state remain shared with their producers.
 */
export interface IAutoMovieSchedule {
  /** Every placed intent, by start then walk order. */
  readonly entries: readonly IAutoMovieScheduleEntry[];

  /**
   * Latest cursor or entry end measured from film origin zero, never below
   * zero; zero for an empty composition. Negative-time entries do not move the
   * origin.
   */
  readonly duration: number;
}
