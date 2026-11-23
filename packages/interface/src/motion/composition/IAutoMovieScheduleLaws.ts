import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { IAutoMovieIntentTiming } from "./IAutoMovieIntentTiming";
import type { IAutoMovieScheduleAlignment } from "./IAutoMovieScheduleAlignment";
import type { IAutoMovieScheduleContext } from "./IAutoMovieScheduleContext";
import type { IAutoMovieScheduleCue } from "./IAutoMovieScheduleCue";
import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/** The production's pure laws. */
export interface IAutoMovieScheduleLaws {
  /**
   * Tracks of named instants that belong to no intent, by track name: a
   * dialogue's line starts and accents, a score's beats. A part aligns to one
   * and an intent is cut on one as on an anchored intent's events.
   */
  cues?: Readonly<Record<string, readonly IAutoMovieScheduleCue[]>>;

  /**
   * The instants of a track the laws compute from what is placed so far, read
   * when an `at` names neither an anchor nor a track of `cues`: the hits a
   * struck person has received, known only once their strikers are placed.
   * Undefined for a name the laws do not know, which the walk then refuses as a
   * missing anchor. Pure in the entries given.
   *
   * @param of The track's name.
   * @param entries Entries placed so far, in walk order.
   * @returns The instants, or undefined.
   */
  instants?(
    of: string,
    entries: readonly IAutoMovieScheduleEntry[],
  ): readonly IAutoMovieScheduleCue[] | undefined;

  /**
   * The second an intent must start at for its named instant to fall on a
   * target second. It places nothing: the intent is timed again when it is
   * placed at the second returned.
   */
  align?(
    intent: IAutoMovieIntent,
    instant: string,
    target: number,
    context: IAutoMovieScheduleAlignment,
  ): number;

  /** Duration and contact of an intent. */
  timing(
    intent: IAutoMovieIntent,
    context: IAutoMovieScheduleContext,
  ): IAutoMovieIntentTiming;

  /**
   * The share of an intent's duration at which a `proximity` cut happens, found
   * from the production's motion, or undefined when it never does.
   */
  until?(
    intent: IAutoMovieIntent,
    placed: {
      /** Proposed start in film seconds. */
      start: number;
      /** Full uncut duration in seconds. */
      duration: number;
    },
    context: IAutoMovieScheduleContext,
  ): number | undefined;

  /**
   * Outcome class for the draft entry before it is appended; absent callback or
   * undefined result omits outcome. The draft contains no outcome or state.
   */
  outcome?(
    entry: IAutoMovieScheduleEntry,
    context: IAutoMovieScheduleContext,
  ): string | undefined;

  /**
   * Production-owned state for the same draft passed to outcome, without
   * outcome attached. Undefined omits state; other values are retained by
   * reference and are not deep-frozen. The engine does not interpret their
   * shape.
   */
  state?(
    entry: IAutoMovieScheduleEntry,
    context: IAutoMovieScheduleContext,
  ): unknown;
}
