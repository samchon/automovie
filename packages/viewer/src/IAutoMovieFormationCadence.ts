import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake.js";

/**
 * Cycles one unit has turned over, and the take it is performing now.
 *
 * @evidence contracts/common.md#principled-implementation Keeps selected take, travel-driven cycle advance and turn-driven cycles per radius meter distinct, allowing each formation member's phase to combine shared cadence with its own radius.
 * @evidence contracts/common.md#clear-and-simple-design One sampled cadence record is shared by CPU cycle-position evaluation and uniform application rather than recalculating temporal segments per member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cadence contains accumulated physical travel and turning quantities, without naming a figure or substituting an authored expected phase.
 * @evidence contracts/common.md#meaningful-documentation Members identify the active take and distinguish whole-unit cycle advance from cycles per meter of turning radius.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result interface performs no segment folding or gait lookup.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The cadence value describes shared inputs but does not itself coordinate cache equivalence or execution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Cadence borrows its take from the formation repertoire and acquires no new table texture.
 */
export interface IAutoMovieFormationCadence {
  /** Take playing at the sampled time. */
  take: IAutoMovieFormationCycleTake;

  /** Cycles every member has turned over by the unit's own travel. */
  advance: number;

  /** Cycles per meter of member radius turned over by the unit's turning. */
  turn: number;
}
