import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake.js";

/**
 * Cycles one unit has turned over, and the take it is performing now.
 *
 * @evidence contracts/development/design.md#principled-representation Keeps selected take, travel-driven cycle advance and turn-driven cycles per radius meter distinct, allowing each formation member's phase to combine shared cadence with its own radius.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One sampled cadence record is shared by CPU cycle-position evaluation and uniform application rather than recalculating temporal segments per member.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Cadence contains accumulated physical travel and turning quantities, without naming a figure or substituting an authored expected phase.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify the active take and distinguish whole-unit cycle advance from cycles per meter of turning radius.
 */
export interface IAutoMovieFormationCadence {
  /** Take playing at the sampled time. */
  take: IAutoMovieFormationCycleTake;

  /** Cycles every member has turned over by the unit's own travel. */
  advance: number;

  /** Cycles per meter of member radius turned over by the unit's turning. */
  turn: number;
}
