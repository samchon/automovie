import { IAutoMovieAngleRange, IAutoMovieJointConstraint } from "@automovie/interface";
import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";

const assertAxisFrame = (
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

const shift = (
  axis: keyof IAutoMovieRestFrame,
  range: IAutoMovieAngleRange | null,
  frame: IAutoMovieAxisFrame | undefined,
): IAutoMovieAngleRange | null => {
  assertAxisFrame(`rest frame ${axis}`, frame);
  if (range === null) return null;
  if (frame === undefined) return range;
  // r = (clinical − neutral) / sign; a sign of −1 flips the interval, so sort.
  const a = (range.min - frame.neutral) / frame.sign;
  const b = (range.max - frame.neutral) / frame.sign;
  return { min: Math.min(a, b), max: Math.max(a, b) };
};

/**
 * Re-express a clinical {@link IAutoMovieJointConstraint} in a rig's
 * rest-relative pose space using its {@link IAutoMovieRestFrame}, so ROM
 * validation/clamping and the ROM overlay line up with how the rig actually
 * articulates, the reconciliation a physics joint does implicitly by defining
 * its limits in the joint's own reference frame.
 *
 * The `swingDeg` cone half-angle carries through unchanged: it caps the
 * _combined_ swing away from rest (`2·acos(cos(flexion/2)·cos(abduction/2))`
 * over the pose angles the rig articulates), so it is a deviation magnitude the
 * rest frame's `sign`/`neutral` shift (which relocates each axis's origin, not
 * the scale of a deviation) leaves invariant. Dropping it here silenced the
 * ball-joint cone on exactly the bones that carry a rest frame (the shoulders),
 * since `validateJointRom`/`clampJointRom` gate the cone on `swingDeg !=
 * null`.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Re-expresses clinical range limits in the joint's actual rest-relative frame.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Expresses effective ROM in the same rig basis used by articulation.
 * @author Samchon
 */
export const restRelativeConstraint = (
  clinical: IAutoMovieJointConstraint,
  frame: IAutoMovieRestFrame,
): IAutoMovieJointConstraint => ({
  flexion: shift("flexion", clinical.flexion, frame.flexion),
  abduction: shift("abduction", clinical.abduction, frame.abduction),
  twist: shift("twist", clinical.twist, frame.twist),
  swingDeg: clinical.swingDeg,
});
