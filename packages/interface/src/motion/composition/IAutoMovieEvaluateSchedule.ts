import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/** Data and callback contracts shared by the EvaluateSchedule operations. */
export namespace IAutoMovieEvaluateSchedule {
  /** One active entry. */
  export interface IActive {
    /** The entry. */
    entry: IAutoMovieSchedule.IEntry;

    /** Seconds since its start. */
    local: number;

    /** Share of its duration elapsed, in [0, 1). */
    phase: number;
  }

  /** The schedule at an instant. */
  export interface IInstant {
    /** The instant. */
    seconds: number;

    /** Active entries, by start. */
    active: IAutoMovieEvaluateSchedule.IActive[];

    /** Each subject's state after its latest ended entry with a state. */
    states: Record<string, unknown>;
  }
}
