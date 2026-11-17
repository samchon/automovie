/**
 * Whether bounded support recovery is exhausted at one tick. Whether bounded support recovery is exhausted at one tick.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines continuously lost-support timing and the independent failed-landing condition. States the updated open loss clock and whether the recovery budget is exhausted.
 * @evidence contracts/development/design.md#principled-representation seconds, lostSince and duration share the native local-second clock; absence of lostSince means no open unrecoverable interval. lostSince is local seconds or undefined; exhausted is a budget verdict rather than measured contact or a bracing decision.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalBalanceExhaustion reads controller history at each tick and leaves policy ownership with advancePhysicalBalance. advancePhysicalBalance stores the returned clock and combines exhaustion with its optional bracing policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Changing to a recoverable assessment clears the loss interval; a failed landing still exhausts the recovery budget immediately. Exhaustion is distinct from unconditional effort withdrawal: the bracing path can retain effort above its measured height limit.
 */
export namespace IAutoMoviePhysicalBalanceExhaustion {
  /**
   * Whether bounded support recovery is exhausted at one tick.
   *
   * Continuously unrecoverable support starts a clock at its first tick and
   * keeps that start while it lasts; any other assessment clears it. Recovery is
   * exhausted once the clock has run for the policy's duration, inclusive, or at
   * once after a failed landing. Exhaustion informs effort withdrawal, while an
   * optional bracing policy can retain effort above its measured height limit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines continuously lost-support timing and the independent failed-landing condition.
   * @evidence contracts/development/design.md#principled-representation seconds, lostSince and duration share the native local-second clock; absence of lostSince means no open unrecoverable interval.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalBalanceExhaustion reads controller history at each tick and leaves policy ownership with advancePhysicalBalance.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Changing to a recoverable assessment clears the loss interval; a failed landing still exhausts the recovery budget immediately.
   */
  export type IInput = {
    /** Whether this tick's support assessment is unrecoverable. */ unrecoverable: boolean;
    /** Start of the current unrecoverable interval, seconds, when one is open. */ lostSince?: number;
    /** Whether a timed-out landing has failed. */ failedLanding?: boolean;
    /** Current native tick time, seconds. */ seconds: number;
    /** Policy recovery duration, seconds. */ duration: number;
  };

  /**
   * Whether bounded support recovery is exhausted at one tick.
   *
   * Continuously unrecoverable support starts a clock at its first tick and
   * keeps that start while it lasts; any other assessment clears it. Recovery is
   * exhausted once the clock has run for the policy's duration, inclusive, or at
   * once after a failed landing. Exhaustion informs effort withdrawal, while an
   * optional bracing policy can retain effort above its measured height limit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the updated open loss clock and whether the recovery budget is exhausted.
   * @evidence contracts/development/design.md#principled-representation lostSince is local seconds or undefined; exhausted is a budget verdict rather than measured contact or a bracing decision.
   * @evidence contracts/development/design.md#minimal-and-owned-surface advancePhysicalBalance stores the returned clock and combines exhaustion with its optional bracing policy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Exhaustion is distinct from unconditional effort withdrawal: the bracing path can retain effort above its measured height limit.
   */
  export type IResult = {
    /** Start of the unrecoverable interval after this tick, undefined when closed. */ lostSince:
      | number
      | undefined;
    /** Whether the recovery time budget is exhausted; optional bracing still determines final effort withdrawal. */ exhausted: boolean;
  };
}
