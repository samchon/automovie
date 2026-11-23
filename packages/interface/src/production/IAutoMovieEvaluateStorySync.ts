import type { IAutoMovieShotStoryTime } from "./IAutoMovieShotStoryTime";

/**
 * Event addresses and read callbacks for a story-clock simultaneity verdict.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Event addresses and read callbacks for a story-clock simultaneity verdict. Callbacks return shot-local event seconds and a shot-to-story affine pin; tolerance is finite nonnegative story seconds admitted by the caller. Spread compares the earliest and latest mapped values inclusively.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing/nonfinite values produce an unresolved failed verdict, not invented times. Callback exceptions propagate and neither callback nor returned pin is retained after evaluation.
 * @evidence contracts/development/design.md#principled-representation Callbacks return shot-local event seconds and a shot-to-story affine pin; tolerance is finite nonnegative story seconds admitted by the caller. Spread compares the earliest and latest mapped values inclusively.
 * @evidence contracts/development/design.md#minimal-and-owned-surface evaluateAutoMovieStorySync uses these callbacks once per listed address to build ordered measurement points; the edit timeline never determines story simultaneity.
 */
export namespace IAutoMovieEvaluateStorySync {
  /**
   * Measure one cross-shot simultaneity claim on the production story clock.
   *
   * Each addressed event is taken at its realized shot-local time, mapped through its own shot's pin by {@link autoMovieStoryTime}, and the widest gap between any two resulting story times is compared against the tolerance, inclusive. Nothing here consults the edit: two shots cut minutes apart pass when their pins put the events together, and two adjacent shots fail when their pins do not.
   *
   * The verdict is refusable. An unpinned shot, a missing or non-finite realization, or a story time that is not finite leaves an operand unresolved, and the claim then fails with a summary naming the first such operand and why, because a claim nobody can measure is not a claim that holds. An empty event list fails too. Otherwise the summary names the earliest and latest events, where a tie for latest names the later-listed event so a simultaneous claim quotes two distinct events. Every point is reported in declared order either way.
   *
   * @evidence contracts/development/design.md#principled-representation Callbacks return shot-local event seconds and a shot-to-story affine pin; tolerance is finite nonnegative story seconds admitted by the caller. Spread compares the earliest and latest mapped values inclusively.
   * @evidence contracts/development/design.md#minimal-and-owned-surface evaluateAutoMovieStorySync uses these callbacks once per listed address to build ordered measurement points; the edit timeline never determines story simultaneity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing/nonfinite values produce an unresolved failed verdict, not invented times. Callback exceptions propagate and neither callback nor returned pin is retained after evaluation.
   * @evidence contracts/development/common.md#meaningful-documentation Event addresses and read callbacks for a story-clock simultaneity verdict. Callbacks return shot-local event seconds and a shot-to-story affine pin; tolerance is finite nonnegative story seconds admitted by the caller. Spread compares the earliest and latest mapped values inclusively.
   */
  export type IProps = {
    /** Addressed shot-and-event pairs in their declared order. */
    events: ReadonlyArray<{
      /**
       * Shot identity used verbatim for both callbacks; repeated addresses are measured again in their declared positions.
       */
      shot: string;
      /**
       * Event identity within the addressed shot, passed to realized without rewriting.
       */
      event: string;
    }>;

    /** Finite non-negative tolerance in story seconds; the caller validates it. */
    toleranceSeconds: number;

    /**
     * Synchronous story-clock pin lookup, called once per address after realized even when the realization is unavailable. Null leaves the point unresolved; exceptions propagate and the pin is borrowed only during the call.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronous story-clock pin lookup, called once per address after realized even when the realization is unavailable. Null leaves the point unresolved; exceptions propagate and the pin is borrowed only during the call. Member documentation states the supplied records, units and absence meanings used by evaluateAutoMovieStorySync.
     */
    pin: (shot: string) => IAutoMovieShotStoryTime | null;

    /**
     * Synchronous event-time lookup in shot-local seconds, called once per listed address. Null or a nonfinite answer leaves the point unresolved; finite negative values are not rejected here. Exceptions propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronous event-time lookup in shot-local seconds, called once per listed address. Null or a nonfinite answer leaves the point unresolved; finite negative values are not rejected here. Exceptions propagate. Member documentation states the supplied records, units and absence meanings used by evaluateAutoMovieStorySync.
     */
    realized: (shot: string, event: string) => number | null;
  };
}
