import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/**
 * A composition resolved on the film clock: frozen, ordered entries a
 * renderer, a physics pass or a measurement reads without re-resolving.
 * resolveAutoMovieSchedule freezes the schedule, entries array and individual
 * entry records only. Intent, state, cut records and event arrays are not
 * recursively frozen; intent and state remain shared with their producers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States chronological ordering, film origin and the exact shallow-freezing boundary.
 * @evidence contracts/development/design.md#principled-representation Entries sort by start then walk index; duration is the latest nonnegative cursor/end. Nested producer objects remain shared and are not deep-frozen.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieSchedule produces this canonical schedule for measurement, rendering and subsequent production logic.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Readonly references describe publication without asserting immutability of unknown state or authored intents.
 */
export interface IAutoMovieSchedule {
  /** Every placed intent, by start then walk order. */
  readonly entries: readonly IAutoMovieScheduleEntry[];

  /** Latest cursor or entry end measured from film origin zero, never below zero; zero for an empty composition. Negative-time entries do not move the origin. */
  readonly duration: number;
}
