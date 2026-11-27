import type {
  IAutoMovieProductionFrameRate,
  IAutoMovieResolveProductionFrameRate,
} from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/*
 * The exact frame rate a record carries beside its `fps` display scalar, in
 * lowest terms.
 *
 * When `frameRate` is present it is the identity, reduced by
 * canonicalProductionFrameRate, and `fps` must equal its quotient
 * exactly as a double; when it is absent, `fps` must be a positive safe integer
 * and reads as `fps/1`. A fractional rate therefore always travels as an
 * explicit numerator and denominator, because a decimal such as `29.97` does
 * not identify `30000/1001`.
 * Parameter props: Any record carrying `fps` and an optional exact `frameRate`,
 * such as a film timeline, a frame format or a sound plan.
 * Returns: The reduced numerator and denominator.
 * When the exact rate has non-positive or non-safe-integer
 * terms, when `fps` alone is not a positive safe integer, or when `fps`
 * disagrees with the exact rate.
 */
export function resolveProductionFrameRate(
  props: IAutoMovieResolveProductionFrameRate.IProps,
): IAutoMovieProductionFrameRate {
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
