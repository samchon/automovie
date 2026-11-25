import type { IAutoMovieScheduleContext } from "./IAutoMovieScheduleContext";
import type { IAutoMovieScheduleCue } from "./IAutoMovieScheduleCue";

/**
 * What the laws see while an aligned part's start is found: the placing
 * context, and the instant the part is aligned to with every instant the same
 * anchor or track offers, so laws that cannot meet the one asked can say which
 * later one they can.
 */
export interface IAutoMovieScheduleAlignment extends IAutoMovieScheduleContext {
  /** The instant aligned to. */
  anchor: {
    /** The anchor or cue track. */
    of: string;

    /** The event named; the anchor's contact or start when absent. */
    event?: string;

    /** The occurrence of the event, from 0; the first when absent. */
    index?: number;

    /** Seconds added to the instant. */
    offset: number;

    /** Every named instant of the anchor or track, in film seconds. */
    instants: readonly IAutoMovieScheduleCue[];
  };
}
