import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake.js";

/**
 * Cycles one unit has turned over, and the take it is performing now.
 *
 * @author Samchon
 */
export interface IAutoMovieFormationCadence {
  /** Take playing at the sampled time. */
  take: IAutoMovieFormationCycleTake;

  /** Cycles every member has turned over by the unit's own travel. */
  advance: number;

  /** Cycles per meter of member radius turned over by the unit's turning. */
  turn: number;
}
