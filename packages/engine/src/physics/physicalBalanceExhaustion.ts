/**
 * Whether bounded support recovery is exhausted at one tick.
 *
 * Continuously unrecoverable support starts a clock at its first tick and
 * keeps that start while it lasts; any other assessment clears it. Recovery is
 * exhausted once the clock has run for the policy's duration, inclusive, or at
 * once after a failed landing, which withdraws support rather than inventing a
 * success.
 */
export function physicalBalanceExhaustion(input: {
  /** Whether this tick's support assessment is unrecoverable. */ unrecoverable: boolean;
  /** Start of the current unrecoverable interval, seconds, when one is open. */ lostSince?: number;
  /** Whether a timed-out landing has failed. */ failedLanding?: boolean;
  /** Current native tick time, seconds. */ seconds: number;
  /** Policy recovery duration, seconds. */ duration: number;
}): {
  /** Start of the unrecoverable interval after this tick, undefined when closed. */ lostSince:
    | number
    | undefined;
  /** Whether root tracking must be withdrawn. */ exhausted: boolean;
} {
  const lostSince: number | undefined = input.unrecoverable
    ? (input.lostSince ?? input.seconds)
    : undefined;
  return {
    lostSince,
    exhausted:
      input.failedLanding === true ||
      (lostSince !== undefined && input.seconds - lostSince >= input.duration),
  };
}
