import { IAutoMovieMotion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { timeScaleMotion } from "./timeScaleMotion";
import { travelMotion } from "./travelMotion";

const assertFiniteVector: (label: string, vector: IAutoMovieVector3) => void = (label: string, vector: IAutoMovieVector3): void => {
  if (!Number.isFinite(vector.x)) throw new Error(`${label}.x must be finite`);
  if (!Number.isFinite(vector.y)) throw new Error(`${label}.y must be finite`);
  if (!Number.isFinite(vector.z)) throw new Error(`${label}.z must be finite`);
};


/**
 * Carry an admitted gait over a positive metre distance in a finite nonzero direction at a requested positive speed. Whole cycles determine duration; a trip shorter than half a nominal stride compresses one cycle, and optional faceTravel aligns model +Z with the horizontal heading.
 *
 * @evidence contracts/common.md#principled-implementation Normalizes direction, rounds nominal cycle count with a one-cycle minimum, compresses the short-trip cycle when needed, and derives velocity from exact distance over baked duration; travelMotion preserves gait seam interpolation and continuous root travel.
 * @evidence contracts/common.md#clear-and-simple-design This function owns distance/speed sizing and optional heading, while timeScaleMotion owns clip-clock compression and travelMotion owns cycle repetition and root placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid scalar/vector admission throws; the half-speed floor is an explicit locomotion sizing policy rather than a named-body adjustment, and faceTravel only yaws so vertical direction components do not pitch the rig.
 * @evidence contracts/common.md#meaningful-documentation States distance/speed units, exact-arrival sizing, short-trip compression, default strafe behavior and the horizontal-only facing rule.
 * @evidence contracts/performance.md#efficient-algorithms Sizing is constant work; delegated baking scales with chosen cycle count C times gait keyframes K, plus one O(K) clock copy for short-trip compression, with no additional trajectory sampling.
 * @evidence contracts/performance.md#reuse-equivalent-work The normalized heading serves velocity and facing; unchanged gait data are passed directly unless the one-cycle short-trip policy requires a new clock.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the baked clip and keyframes; intermediate compressed clips are call-local and no gait cache, physics handle or task is retained.
 */
export const locomoteMotion: (id: string, gait: IAutoMovieMotion, distance: number, speed: number, direction: IAutoMovieVector3, faceTravel?: boolean) => IAutoMovieMotion = (
  id: string,
  gait: IAutoMovieMotion,
  distance: number,
  speed: number,
  direction: IAutoMovieVector3,
  faceTravel: boolean = false,
): IAutoMovieMotion => {
  if (!Number.isFinite(distance))
    throw new Error("locomote distance must be finite and positive");
  if (distance <= 0)
    throw new Error("locomote distance must be finite and positive");
  if (!Number.isFinite(speed))
    throw new Error("locomote speed must be finite and positive");
  if (speed <= 0) throw new Error("locomote speed must be finite and positive");
  if (!Number.isFinite(gait.duration))
    throw new Error("locomote gait duration must be finite and positive");
  if (gait.duration <= 0)
    throw new Error("locomote gait duration must be finite and positive");
  assertFiniteVector("locomote direction", direction);
  const directionLength: number = Vector3.length(direction);
  if (!Number.isFinite(directionLength))
    throw new Error("locomote direction length must be finite");
  if (directionLength === 0)
    throw new Error("locomote direction must be non-zero");

  const quantized: number = distance / (speed * gait.duration);
  const cycles: number = Math.max(1, Math.round(quantized));
  // Whole-cycle quantization bounds the effective speed at ½×nominal
  // everywhere EXCEPT the min-1-cycle clamp, where a shrinking distance made
  // slow-motion unbounded: a 0.1 m walk over a full 1 s cycle skated at
  // 0.1 m/s with full-rate leg swing (#1065). Hold the same ½ floor there by
  // COMPRESSING the single cycle (a quick, short step): the whole cycle
  // still plays, so loop continuity and exact arrival are untouched.
  const base: IAutoMovieMotion = quantized < 0.5 ? timeScaleMotion(gait, quantized / 0.5) : gait;
  const heading: IAutoMovieVector3 = Vector3.scale(direction, 1 / directionLength);
  // Whole cycles quantize the clip length; snap the baked velocity so the
  // clip arrives at exactly `distance` (followPathMotion's policy). Baking
  // the requested speed verbatim would travel speed×cycles×duration and miss
  // the destination by up to half a stride.
  const velocity: IAutoMovieVector3 = Vector3.scale(heading, distance / (cycles * base.duration));
  const facing: ReturnType<typeof Quaternion.fromAxisAngle> | undefined = faceTravel
    ? Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        (Math.atan2(heading.x, heading.z) * 180) / Math.PI,
      )
    : undefined;
  return travelMotion(id, base, cycles, velocity, facing);
};
