import {
  IAutoMovieAngleRange,
  type IAutoMovieAxisFrame,
  IAutoMovieJointConstraint,
  type IAutoMovieRestFrame,
} from "@automovie/interface";

/*
 * Convert clinical degree interval endpoints by (clinical - neutral) / sign and
 * reorder mirrored bounds. Null axes remain immobile and absent frames retain
 * range identity. swingDeg is carried as the existing rest-deviation policy;
 * arbitrary neutral shifts do not prove clinical swing-metric invariance.
 */
export function restRelativeConstraint(
  clinical: IAutoMovieJointConstraint,
  frame: IAutoMovieRestFrame,
): IAutoMovieJointConstraint {
  return {
    flexion: shift("flexion", clinical.flexion, frame.flexion),
    abduction: shift("abduction", clinical.abduction, frame.abduction),
    twist: shift("twist", clinical.twist, frame.twist),
    swingDeg: clinical.swingDeg,
  };
}

function assertAxisFrame(
  label: string,
  frame: IAutoMovieAxisFrame | undefined,
): void {
  if (frame === undefined) return;
  if (frame.sign !== 1 && frame.sign !== -1)
    throw new Error(`${label} sign must be 1 or -1, but was ${frame.sign}`);
}

function shift(
  axis: keyof IAutoMovieRestFrame,
  range: IAutoMovieAngleRange | null,
  frame: IAutoMovieAxisFrame | undefined,
): IAutoMovieAngleRange | null {
  assertAxisFrame(`rest frame ${axis}`, frame);
  if (range === null) return null;
  if (frame === undefined) return range;
  // r = (clinical − neutral) / sign; a sign of −1 flips the interval, so sort.
  const a: number = (range.min - frame.neutral) / frame.sign;
  const b: number = (range.max - frame.neutral) / frame.sign;
  return { min: Math.min(a, b), max: Math.max(a, b) };
}
