import type {
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { timeScaleMotion } from "./timeScaleMotion";
import { travelMotion } from "./travelMotion";

/*
 * Carry an admitted gait over a positive metre distance in a finite nonzero
 * direction at a requested positive speed. Whole cycles determine duration; a
 * trip shorter than half a nominal stride compresses one cycle, and optional
 * faceTravel aligns model +Z with the horizontal heading.
 */
export const locomoteMotion: (
  id: string,
  gait: IAutoMovieMotion,
  distance: number,
  speed: number,
  direction: IAutoMovieVector3,
  faceTravel?: boolean,
) => IAutoMovieMotion = (
  id: string,
  gait: IAutoMovieMotion,
  distance: number,
  speed: number,
  direction: IAutoMovieVector3,
  faceTravel: boolean = false,
): IAutoMovieMotion => {
  if (distance <= 0)
    throw new Error("locomote distance must be finite and positive");
  if (speed <= 0) throw new Error("locomote speed must be finite and positive");
  if (gait.duration <= 0)
    throw new Error("locomote gait duration must be finite and positive");
  const directionLength: number = AutoMovieEngineVector3.length(direction);
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
  const base: IAutoMovieMotion =
    quantized < 0.5 ? timeScaleMotion(gait, quantized / 0.5) : gait;
  const heading: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    direction,
    1 / directionLength,
  );
  // Whole cycles quantize the clip length; snap the baked velocity so the
  // clip arrives at exactly `distance` (followPathMotion's policy). Baking
  // the requested speed verbatim would travel speed×cycles×duration and miss
  // the destination by up to half a stride.
  const velocity: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    heading,
    distance / (cycles * base.duration),
  );
  const facing: IAutoMovieQuaternion | undefined = faceTravel
    ? yawRotation((Math.atan2(heading.x, heading.z) * 180) / Math.PI)
    : undefined;
  return travelMotion(id, base, cycles, velocity, facing);
};

/*
 * Rotations about the fixed world-up axis.
 */
const yawRotation: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle> =
  AutoMovieEngineQuaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });
