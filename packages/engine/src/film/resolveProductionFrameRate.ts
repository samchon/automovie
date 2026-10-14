import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/**
 * The exact frame rate a record carries beside its `fps` display scalar, in lowest terms.
 *
 * When `frameRate` is present it is the identity, reduced by {@link canonicalProductionFrameRate}, and `fps` must equal its quotient exactly as a double; when it is absent, `fps` must be a positive safe integer and reads as `fps/1`. A fractional rate therefore always travels as an explicit numerator and denominator, because a decimal such as `29.97` does not identify `30000/1001`.
 *
 * @param props Any record carrying `fps` and an optional exact `frameRate`, such as a film timeline, a frame format or a sound plan.
 * @returns The reduced numerator and denominator.
 * @throws {Error} When the exact rate has non-positive or non-safe-integer terms, when `fps` alone is not a positive safe integer, or when `fps` disagrees with the exact rate.
 *
 * @evidence contracts/common.md#principled-implementation Reduces the rational with the greatest common divisor through `canonicalProductionFrameRate`, then requires the scalar to equal the double nearest the reduced quotient, so the two spellings can never name different rates and frame-to-time arithmetic runs on integers.
 * @evidence contracts/common.md#clear-and-simple-design The single reader of the two rate fields for the film timeline, the frame sampler, the effect timeline, sound rendering and the render planner, so every consumer resolves the same identity and the same refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rate is special-cased: the NTSC family and integer rates go through the same reduction and the same equality, and a mismatch throws instead of preferring one field.
 * @evidence contracts/common.md#meaningful-documentation States which field wins, the scalar-only rule, why fractional rates must be explicit, the accepted record kinds, and every failure.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One Euclidean reduction, logarithmic in the smaller term, and one division, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolves one record per call; callers that sample many frames resolve it per frame, which is constant work on two integers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the returned pair only and retains nothing.
 */
export function resolveProductionFrameRate (props: {
  /** Display frames per second; must equal the exact rate when one is given. */
  fps: number;

  /** Exact rate; omitted for an integer `fps`. */
  frameRate?: IAutoMovieProductionFrameRate;
}): IAutoMovieProductionFrameRate {
  const rate: IAutoMovieProductionFrameRate = canonicalProductionFrameRate(
    props.frameRate ?? props.fps,
  );
  if (
    props.frameRate !== undefined &&
    props.fps !== rate.numerator / rate.denominator
  )
    throw new Error(
      `Production fps ${props.fps} does not equal its exact ${rate.numerator}/${rate.denominator} frame-rate identity.`,
    );
  return rate;
}
