import type { IAutoMovieScheduleContext } from "./IAutoMovieScheduleContext";
import type { IAutoMovieScheduleCue } from "./IAutoMovieScheduleCue";

/**
 * What the laws see while an aligned part's start is found: the placing
 * context, and the instant the part is aligned to with every instant the
 * same anchor or track offers, so laws that cannot meet the one asked can
 * say which later one they can.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives alignment target provenance, occurrence defaults, offsets and all available instants.
 * @evidence contracts/development/design.md#principled-representation The anchor names an earlier intent or cue track and instants use absolute film seconds; offset is seconds, index is a zero-based source-order occurrence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSchedulePlace passes this richer context only to align before timing the chosen start again.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts It extends the ordinary placement context and reuses IAutoMovieScheduleCue rather than introducing another event-time representation.
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
