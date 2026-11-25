import type { IAutoMovieShotStoryTime } from "./IAutoMovieShotStoryTime";

/** Event addresses and read callbacks for a story-clock simultaneity verdict. */
export namespace IAutoMovieEvaluateStorySync {
  /**
   * Measure one cross-shot simultaneity claim on the production story clock.
   *
   * Each addressed event is taken at its realized shot-local time, mapped
   * through its own shot's pin by {@link autoMovieStoryTime}, and the widest gap
   * between any two resulting story times is compared against the tolerance,
   * inclusive. Nothing here consults the edit: two shots cut minutes apart pass
   * when their pins put the events together, and two adjacent shots fail when
   * their pins do not.
   *
   * The verdict is refusable. An unpinned shot, a missing or non-finite
   * realization, or a story time that is not finite leaves an operand
   * unresolved, and the claim then fails with a summary naming the first such
   * operand and why, because a claim nobody can measure is not a claim that
   * holds. An empty event list fails too. Otherwise the summary names the
   * earliest and latest events, where a tie for latest names the later-listed
   * event so a simultaneous claim quotes two distinct events. Every point is
   * reported in declared order either way.
   */
  export type IProps = {
    /** Addressed shot-and-event pairs in their declared order. */
    events: ReadonlyArray<{
      /**
       * Shot identity used verbatim for both callbacks; repeated addresses are
       * measured again in their declared positions.
       */
      shot: string;
      /**
       * Event identity within the addressed shot, passed to realized without
       * rewriting.
       */
      event: string;
    }>;

    /** Finite non-negative tolerance in story seconds; the caller validates it. */
    toleranceSeconds: number;

    /**
     * Synchronous story-clock pin lookup, called once per address after
     * realized even when the realization is unavailable. Null leaves the point
     * unresolved; exceptions propagate and the pin is borrowed only during the
     * call.
     */
    pin: (shot: string) => IAutoMovieShotStoryTime | null;

    /**
     * Synchronous event-time lookup in shot-local seconds, called once per
     * listed address. Null or a nonfinite answer leaves the point unresolved;
     * finite negative values are not rejected here. Exceptions propagate.
     */
    realized: (shot: string, event: string) => number | null;
  };
}
