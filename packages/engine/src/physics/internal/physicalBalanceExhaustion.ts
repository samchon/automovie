import type { IAutoMoviePhysicalBalanceExhaustion } from "@automovie/interface";

/*
 * Whether bounded support recovery is exhausted at one tick.
 *
 * Continuously unrecoverable support starts a clock at its first tick and keeps
 * that start while it lasts; any other assessment clears it. Recovery is
 * exhausted once the clock has run for the policy's duration, inclusive, or at
 * once after a failed landing, which withdraws support rather than inventing a
 * success.
 */
export function physicalBalanceExhaustion(
  input: IAutoMoviePhysicalBalanceExhaustion.IInput,
): IAutoMoviePhysicalBalanceExhaustion.IResult {
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
