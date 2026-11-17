import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { IAutoMovieMotionEvent } from "../IAutoMovieMotionEvent";
import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/** Timing and decision callbacks used during the synchronous schedule walk. Calls may repeat while aligning; laws must be deterministic and must not mutate or retain the borrowed, growing entries array. Exceptions propagate. The resulting schedule retains intents and state values, but not these callbacks. */
export namespace IAutoMovieResolveSchedule {
  /**
 * What the laws see while an intent is placed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the proposed film start and borrowed live walk-order entries.
 * @evidence contracts/development/design.md#principled-representation start is film seconds; entries excludes the current draft and is a growing array, not a frozen historical snapshot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSchedulePlace supplies this context to timing, until, outcome and state; laws must copy if they need a snapshot.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The context exposes only already placed entries, making declaration-order dependence explicit.
 */
    export interface IContext {
      /** Proposed start on the film clock, seconds from composition origin zero; during align this is the anchor instant plus offset. */
      start: number;
  
      /** Borrowed live walk-order array, excluding the entry currently being timed or decided; take an explicit copy for a snapshot. */
      entries: readonly IAutoMovieSchedule.IEntry[];
    }

  /**
 * What the laws see while an aligned part's start is found: the placing
 * context, and the instant the part is aligned to with every instant the
 * same anchor or track offers, so laws that cannot meet the one asked can
 * say which later one they can.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives alignment target provenance, occurrence defaults, offsets and all available instants.
 * @evidence contracts/development/design.md#principled-representation The anchor names an earlier intent or cue track and instants use absolute film seconds; offset is seconds, index is a zero-based source-order occurrence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSchedulePlace passes this richer context only to align before timing the chosen start again.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts It extends the ordinary placement context and reuses ICue rather than introducing another event-time representation.
 */
    export interface IAlignment extends IAutoMovieResolveSchedule.IContext {
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
        instants: readonly IAutoMovieResolveSchedule.ICue[];
      };
    }

  /**
 * An intent's timing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates full duration, relative contact offset and event shares before cuts.
 * @evidence contracts/development/design.md#principled-representation AutoMovieSchedulePlace admits finite nonnegative duration and a contact inside it; event shares are caller-admitted except when selected as a cut.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The production timing law creates this result; placement converts its relative values to absolute film seconds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing contact or event list records no such instant rather than silently inventing an action-specific phase.
 */
    export interface ITiming {
      /** Full uncut duration in seconds; AutoMovieSchedulePlace rejects negative or nonfinite values. */
      duration: number;
  
      /** Seconds from the start to its contact or decisive instant, within the duration. */
      contact?: number;
  
      /** Named instants as shares of the full duration; omitted means none. Callers supply valid shares: only a share selected as a cut is range-checked by the scheduler. */
      events?: readonly IAutoMovieMotionEvent[];
    }

  /**
 * A named instant of a cue track or of a placed entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines a named absolute film instant, permitting repeated names in source order.
 * @evidence contracts/development/design.md#principled-representation seconds shares composition origin zero and is not an action-relative offset; the supplying law owns finite values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fixed cue tracks, dynamic instants and placed-entry events use this shape for schedule anchor lookup.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Repeated names remain separate occurrences selected by index rather than being lost in a name-keyed map.
 */
    export interface ICue {
      /** The instant's name; a track may repeat one, as a score repeats `beat`. */
      name: string;
  
      /** Absolute film seconds, not an offset from the current intent. Numeric validity is the law's responsibility. */
      seconds: number;
    }

  /**
 * The production's pure laws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains synchronous pure callbacks, borrowed growing entries, callback absence and retained opaque state.
 * @evidence contracts/development/design.md#principled-representation timing is mandatory; optional align and until are required only by matching composition features. Missing required laws throw during placement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieSchedule holds these laws only during resolution; outcome and state run on the draft before it enters context.entries.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pre-existing unknown state is deliberately uninterpreted production data; callers own its schema and immutability, and the engine retains it by reference.
 */
    export interface ILaws {
      /**
       * Tracks of named instants that belong to no intent, by track name: a
       * dialogue's line starts and accents, a score's beats. A part aligns to
       * one and an intent is cut on one as on an anchored intent's events.
       */
      cues?: Readonly<Record<string, readonly IAutoMovieResolveSchedule.ICue[]>>;
  
      /**
       * The instants of a track the laws compute from what is placed so far,
       * read when an `at` names neither an anchor nor a track of `cues`: the
       * hits a struck person has received, known only once their strikers
       * are placed. Undefined for a name the laws do not know, which the
       * walk then refuses as a missing anchor. Pure in the entries given.
       *
       * @param of The track's name.
       * @param entries Entries placed so far, in walk order.
       * @returns The instants, or undefined.
       */
      instants?(
        of: string,
        entries: readonly IAutoMovieSchedule.IEntry[],
      ): readonly IAutoMovieResolveSchedule.ICue[] | undefined;
  
      /**
       * The second an intent must start at for its named instant to fall on a
       * target second. It places nothing: the intent is timed again when it
       * is placed at the second returned.
       */
      align?(
        intent: IAutoMovieIntent,
        instant: string,
        target: number,
        context: IAutoMovieResolveSchedule.IAlignment,
      ): number;
  
      /** Duration and contact of an intent. */
      timing(intent: IAutoMovieIntent, context: IAutoMovieResolveSchedule.IContext): IAutoMovieResolveSchedule.ITiming;
  
      /**
       * The share of an intent's duration at which a `proximity` cut happens,
       * found from the production's motion, or undefined when it never does.
       */
      until?(
        intent: IAutoMovieIntent,
        placed: {
          /** Proposed start in film seconds. */
          start: number;
          /** Full uncut duration in seconds. */
          duration: number;
        },
        context: IAutoMovieResolveSchedule.IContext,
      ): number | undefined;
  
      /** Outcome class for the draft entry before it is appended; absent callback or undefined result omits outcome. The draft contains no outcome or state. */
      outcome?(
        entry: IAutoMovieSchedule.IEntry,
        context: IAutoMovieResolveSchedule.IContext,
      ): string | undefined;
  
      /** Production-owned state for the same draft passed to outcome, without outcome attached. Undefined omits state; other values are retained by reference and are not deep-frozen. The engine does not interpret their shape. */
      state?(entry: IAutoMovieSchedule.IEntry, context: IAutoMovieResolveSchedule.IContext): unknown;
    }
}
