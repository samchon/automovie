/**
 * Whether bounded support recovery is exhausted at one tick.
 *
 * Continuously unrecoverable support starts a clock at its first tick and
 * keeps that start while it lasts; any other assessment clears it. Recovery is
 * exhausted once the clock has run for the policy's duration, inclusive, or at
 * once after a failed landing, which withdraws support rather than inventing a
 * success.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Whether bounded support recovery is exhausted at one tick) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Whether bounded support recovery is exhausted at one tick) directly over its typed inputs (`input`) as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 11 lines and 2 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
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
