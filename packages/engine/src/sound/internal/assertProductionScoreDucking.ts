import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";

/*
 * Refuse a score ducking policy whose gain or frame counts fall outside the
 * authored ranges.
 */
export function assertProductionScoreDucking(
  policy: IAutoMovieProductionSoundPlan["scoreDucking"] | null,
): void {
  if (
    policy !== undefined &&
    (policy === null ||
      policy.gain < 0 ||
      policy.gain > 1 ||
      policy.attackFrames < 0 ||
      policy.releaseFrames < 0)
  )
    throw new Error(
      "Production score ducking requires a finite gain in [0, 1] and nonnegative safe-integer attack and release frames.",
    );
}
