import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/**
 * A composition resolved on the film clock: frozen, ordered entries a
 * renderer, a physics pass or a measurement reads without re-resolving.
 */
export interface IAutoMovieSchedule {
  /** Every placed intent, by start then walk order. */
  readonly entries: readonly IAutoMovieSchedule.IEntry[];

  /** Seconds from 0 to the last entry's end. */
  readonly duration: number;
}
/** Companion types of {@link IAutoMovieSchedule}. */
export namespace IAutoMovieSchedule {
  /** One placed intent. */
  export interface IEntry {
    /** Walk-order index, stable for one composition. */
    readonly index: number;

    /** The acting subject's id. */
    readonly subject: string;

    /** The intent. */
    readonly intent: IAutoMovieIntent;

    /** Start, seconds. */
    readonly start: number;

    /** Contact or decisive instant, seconds, when the timing declares one. */
    readonly contact?: number;

    /** End, seconds; at least `start`. */
    readonly end: number;

    /** The production's outcome class, when its outcome function gives one. */
    readonly outcome?: string;

    /** The production's state snapshot after this entry, when its state function gives one. */
    readonly state?: unknown;
  }
}
