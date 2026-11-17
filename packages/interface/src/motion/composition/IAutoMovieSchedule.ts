import type { IAutoMovieIntent } from "./IAutoMovieIntent";

/**
 * A composition resolved on the film clock: frozen, ordered entries a
 * renderer, a physics pass or a measurement reads without re-resolving.
 * resolveAutoMovieSchedule freezes the schedule, entries array and individual
 * entry records only. Intent, state, cut records and event arrays are not
 * recursively frozen; intent and state remain shared with their producers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States chronological ordering, film origin and the exact shallow-freezing boundary.
 * @evidence contracts/development/design.md#principled-representation Entries sort by start then walk index; duration is the latest nonnegative cursor/end. Nested producer objects remain shared and are not deep-frozen.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieSchedule produces this canonical schedule for measurement, rendering and subsequent production logic.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Readonly references describe publication without asserting immutability of unknown state or authored intents.
 */
export interface IAutoMovieSchedule {
  /** Every placed intent, by start then walk order. */
  readonly entries: readonly IAutoMovieSchedule.IEntry[];

  /** Latest cursor or entry end measured from film origin zero, never below zero; zero for an empty composition. Negative-time entries do not move the origin. */
  readonly duration: number;
}

/** Placed intent records produced in walk order and published in chronological order. */
export namespace IAutoMovieSchedule {
  /**
 * One placed intent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents absolute film instants, full-duration event mapping, cut provenance and retained intent/state.
 * @evidence contracts/development/design.md#principled-representation index remains walk order after chronological sorting; contact after a cut is omitted while original events remain. Runtime timing/cut admission belongs to schedule placement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSchedulePlace creates drafts and resolveAutoMovieSchedule freezes final entry shells; consumers read stable indices for interruption links.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Opaque state is production-owned and unconstrained by the engine; optional contact, outcome, state and cut are independent facts of a placed intent.
 */
    export interface IEntry {
      /** Walk-order index, stable for one composition. */
      readonly index: number;
  
      /** The acting subject's id. */
      readonly subject: string;
  
      /** Original authored intent retained by reference; the resolver neither clones nor freezes it. */
      readonly intent: IAutoMovieIntent;
  
      /** Absolute film seconds from composition origin zero; offsets may place entries before zero. */
      readonly start: number;
  
      /** Absolute film second of the declared contact, omitted if none is declared or it lies after a cut. */
      readonly contact?: number;
  
      /** End, seconds; at least `start`. */
      readonly end: number;
  
      /** The production's outcome class, when its outcome function gives one. */
      readonly outcome?: string;
  
      /** The production's state snapshot after this entry, when its state function gives one. */
      readonly state?: unknown;
  
      /** Where the intent was cut, when it was: the share of its full duration and the event named, if any. */
      readonly cut?: {
        /** Fraction in [0, 1] of the full uncut duration at which the entry ends. */
        readonly share: number;
        /** Own event name or anchor.event label for an event cut; absent for explicit-share and proximity cuts. */
        readonly event?: string;
      };
  
      /** The intent's named events in film seconds, as its timing declared them, before any cut. */
      readonly events?: readonly {
        /** Event name from the timing law; repeated names preserve declaration order. */
        readonly name: string;
        /** Absolute film seconds computed from the original full duration, even if this event lies after the cut. */
        readonly seconds: number;
      }[];
  
      /** The walk-order index of the entry that starts at this one's cut, when one does. */
      readonly interruptedBy?: number;
    }
}
