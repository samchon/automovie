import type { IAutoMovieRenderFormationCycleTake } from "./IAutoMovieRenderFormationCycleTake";

/** Cycles one unit has turned over, and the take it is performing now. */
export interface IAutoMovieRenderFormationCadence {
  /** Take playing at the sampled time. */
  take: IAutoMovieRenderFormationCycleTake;

  /** Cycles every member has turned over by the unit's own travel. */
  advance: number;

  /** Cycles per meter of member radius turned over by the unit's turning. */
  turn: number;
}
