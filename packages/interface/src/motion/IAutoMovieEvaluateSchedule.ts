import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/** Data and callback contracts shared by the EvaluateSchedule operations. */
export namespace IAutoMovieEvaluateSchedule {
  /** One active entry. */
  export interface IActive {
    /** The entry. */
    entry: IAutoMovieScheduleEntry;

    /** Seconds since its start. */
    local: number;

    /** Share of its duration elapsed, in [0, 1). */
    phase: number;
  }

  /** The schedule at an instant. */
  export interface IInstant {
    /** Film seconds on the schedule's clock. */
    seconds: number;

    /**
     * Active entries in the supplied schedule's entry order; this reader does
     * not sort them.
     */
    active: IAutoMovieEvaluateSchedule.IActive[];

    /**
     * Borrowed state from each subject's latest ended entry with a state; equal
     * end times choose the larger entry index.
     */
    states: Record<string, unknown>;
  }
}
