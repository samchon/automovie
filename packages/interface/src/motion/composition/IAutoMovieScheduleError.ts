/** Data and callback contracts shared by the ScheduleError operations. */
export namespace IAutoMovieScheduleError {
  /**
   * The checks:
   *
   * - `anchor`: an anchor or cue track named by an `at` or an `until` is not
   *   placed earlier in walk order;
   * - `event`: the anchor, the track or the intent itself has no event of that
   *   name;
   * - `index`: the event exists but not that occurrence of it, or an occurrence
   *   is named of no event;
   * - `duplicate`: an anchor id is used twice, or names a cue track;
   * - `share`: a cut falls outside the intent's span;
   * - `timing`: the laws gave an invalid duration or contact;
   * - `law`: the laws lack what the composition asks of them (a proximity cut, an
   *   alignment).
   */
  export type Code =
    | "anchor"
    | "event"
    | "index"
    | "duplicate"
    | "share"
    | "timing"
    | "law";

  /** The facts of a schedule error. */
  export interface IProps {
    /** Which check failed. */
    code: IAutoMovieScheduleError.Code;

    /** The subject of the intent being placed. */
    subject?: string | undefined;

    /** Its capability. */
    capability?: string | undefined;

    /** The anchor or track named. */
    of?: string | undefined;

    /** The name or number that failed. */
    value: string | number;

    /** What would have been accepted; none when absent. */
    alternatives?: readonly string[];
  }
}
