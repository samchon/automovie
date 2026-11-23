/**
 * Whether bounded support recovery is exhausted at one tick. Whether bounded
 * support recovery is exhausted at one tick.
 */
export namespace IAutoMoviePhysicalBalanceExhaustion {
  /**
   * Whether bounded support recovery is exhausted at one tick.
   *
   * Continuously unrecoverable support starts a clock at its first tick and
   * keeps that start while it lasts; any other assessment clears it. Recovery
   * is exhausted once the clock has run for the policy's duration, inclusive,
   * or at once after a failed landing. Exhaustion informs effort withdrawal,
   * while an optional bracing policy can retain effort above its measured
   * height limit.
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
   * keeps that start while it lasts; any other assessment clears it. Recovery
   * is exhausted once the clock has run for the policy's duration, inclusive,
   * or at once after a failed landing. Exhaustion informs effort withdrawal,
   * while an optional bracing policy can retain effort above its measured
   * height limit.
   */
  export type IResult = {
    /**
     * Start of the unrecoverable interval after this tick, undefined when
     * closed.
     */ lostSince: number | undefined;
    /**
     * Whether the recovery time budget is exhausted; optional bracing still
     * determines final effort withdrawal.
     */ exhausted: boolean;
  };
}
