import {
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";

const assertAxisFrame: (label: string, frame: IAutoMovieAxisFrame | undefined) => void = (
  label: string,
  frame: IAutoMovieAxisFrame | undefined,
): void => {
  if (frame === undefined) return;
  if (frame.sign !== 1 && frame.sign !== -1)
    throw new Error(`${label} sign must be 1 or -1, but was ${frame.sign}`);
  if (!Number.isFinite(frame.neutral))
    throw new Error(
      `${label} neutral must be finite, but was ${frame.neutral}`,
    );
};

const shift: (axis: keyof IAutoMovieRestFrame, range: IAutoMovieAngleRange | null, frame: IAutoMovieAxisFrame | undefined) => IAutoMovieAngleRange | null = (
  axis: keyof IAutoMovieRestFrame,
  range: IAutoMovieAngleRange | null,
  frame: IAutoMovieAxisFrame | undefined,
): IAutoMovieAngleRange | null => {
  assertAxisFrame(`rest frame ${axis}`, frame);
  if (range === null) return null;
  if (frame === undefined) return range;
  // r = (clinical − neutral) / sign; a sign of −1 flips the interval, so sort.
  const a: number = (range.min - frame.neutral) / frame.sign;
  const b: number = (range.max - frame.neutral) / frame.sign;
  return { min: Math.min(a, b), max: Math.max(a, b) };
};

/**
 * Convert clinical degree interval endpoints by (clinical - neutral) / sign and reorder mirrored bounds. Null axes remain immobile and absent frames retain range identity. swingDeg is carried as the existing rest-deviation policy; arbitrary neutral shifts do not prove clinical swing-metric invariance.
 *
 * @evidence contracts/common.md#principled-implementation Invert sign/neutral on clinical interval endpoints and reorder mirrored bounds, retaining swingDeg as the existing rest-relative deviation-cap policy.
 * @evidence contracts/common.md#clear-and-simple-design Interval conversion shares scalar frame meaning while preserving null axes and absent-frame range identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid frame sign/neutral throws; unchanged swingDeg does not prove clinical two-axis metric invariance under arbitrary neutral shifts.
 * @evidence contracts/common.md#meaningful-documentation Docs identify degrees, endpoint ordering, null/undefined semantics and the cone policy without universal invariance claims.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed axis conversions allocate at most three intervals plus one constraint wrapper.
 * @evidence contracts/performance.md#reuse-equivalent-work Unchanged ranges/frames remain borrowed; changed bounds or rest convention requires new conversion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns wrapper/new intervals and borrows unchanged clinical ranges; no registry, handle or task survives.
 */
export const restRelativeConstraint: (clinical: IAutoMovieJointConstraint, frame: IAutoMovieRestFrame) => IAutoMovieJointConstraint = (
  clinical: IAutoMovieJointConstraint,
  frame: IAutoMovieRestFrame,
): IAutoMovieJointConstraint => ({
  flexion: shift("flexion", clinical.flexion, frame.flexion),
  abduction: shift("abduction", clinical.abduction, frame.abduction),
  twist: shift("twist", clinical.twist, frame.twist),
  swingDeg: clinical.swingDeg,
});
