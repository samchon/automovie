import {
  AutoMovieArkitChannel,
  AutoMovieExpressionPreset,
  AutoMovieHumanoidBone,
  IAutoMovieBlendshapeChannel,
  IAutoMovieExpression,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { segmentIndex } from "../math/segmentIndex";
import { IAutoMovieMotionSample } from "./IAutoMovieMotionSample";
import { cubicBezierEasing } from "./cubicBezierEasing";
import { ease } from "./ease";

const IDENTITY_TRANSFORM: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * Sample caller-admitted clinical motion at finite seconds using clamped or looping clip time and the outgoing segment's easing. Ordered finite keyframes and valid pose/easing data are validateMotion's premise. End samples shallowly share frame data; interior samples interpolate joints, roots and expressions, treating unauthored values as neutral.
 *
 * @evidence contracts/common.md#principled-implementation Uses the shared lower-bound segment search with earlier-segment exact-key ties, interpolates clinical axes linearly through easing, root translation/scale by lerp and rotation by slerp; null axes/roots/expressions are neutral, with null retained only when both sides omit that value.
 * @evidence contracts/common.md#clear-and-simple-design One sampler owns sparse-to-dense clinical interpolation; named/bezier easing and segment search have shared owners, while expression channels blend separately from pose geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty keyframes throw and caller admission owns finite clock/ordered keys; differing expression presets switch at eased midpoint and cubicBezier requires authored controls rather than a fabricated curve. These conventions are explicit API semantics.
 * @evidence contracts/common.md#meaningful-documentation States finite/admitted motion premise, local-time clamp/wrap, exact endpoint sharing, neutral treatment and the distinct interpolation laws.
 * @evidence contracts/performance.md#efficient-algorithms Interior lookup is O(log F) key reads followed by O(Ja+Jb+expression channels) map/set interpolation; endpoints require constant wrapper work and share nested records without full pose copies.
 * @evidence contracts/performance.md#reuse-equivalent-work One segment/eased progress serves pose and expression; joint maps remove repeated linear bone lookup, while no cache assumes keyframes or expression arrays remain unchanged across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Interior results own new interpolated records and endpoint wrappers share original root/joints/expression; temporary maps/sets are call-local, and no frame history, handle or task persists.
 */
export const sampleMotion: (
  motion: IAutoMovieMotion,
  seconds: number,
) => IAutoMovieMotionSample = (
  motion: IAutoMovieMotion,
  seconds: number,
): IAutoMovieMotionSample => {
  const frames: IAutoMovieKeyframe[] = motion.keyframes;
  if (frames.length === 0)
    throw new Error(`motion "${motion.id}" must have keyframes to sample`);

  const time: number = normalizeTime(seconds, motion.duration, motion.loop);

  if (time <= frames[0]!.time) return toSample(motion, frames[0]!);
  const last: IAutoMovieKeyframe = frames[frames.length - 1]!;
  if (time >= last.time) return toSample(motion, last);

  // Precondition: the clip has strictly increasing keyframe times (the contract
  // validateMotion enforces), so the binary search lands on a segment with a
  // positive span, and its tie rule matches the old linear scan exactly.
  const loIdx: number = segmentIndex(
    frames.length,
    (i: number): number => frames[i]!.time,
    time,
  );
  const lo: IAutoMovieKeyframe = frames[loIdx]!;
  const hi: IAutoMovieKeyframe = frames[loIdx + 1]!;
  const span: number = hi.time - lo.time;
  const linearT: number = (time - lo.time) / span;
  const t: number =
    lo.easing === "cubicBezier" && lo.bezier !== null
      ? cubicBezierEasing(lo.bezier, linearT)
      : ease(lo.easing, linearT);

  return {
    pose: interpolatePose(motion.skeleton, lo.pose, hi.pose, t),
    expression: interpolateExpression(lo.expression, hi.expression, t),
  };
};

const normalizeTime: (
  seconds: number,
  duration: number,
  loop: boolean,
) => number = (seconds: number, duration: number, loop: boolean): number => {
  if (duration <= 0) return 0;
  if (loop) {
    const m: number = seconds % duration;
    return m < 0 ? m + duration : m;
  }
  return Math.min(duration, Math.max(0, seconds));
};

const toSample: (
  motion: IAutoMovieMotion,
  frame: IAutoMovieKeyframe,
) => IAutoMovieMotionSample = (
  motion: IAutoMovieMotion,
  frame: IAutoMovieKeyframe,
): IAutoMovieMotionSample => ({
  pose: { ...frame.pose, skeleton: motion.skeleton },
  expression: frame.expression,
});

const interpolatePose: (
  skeleton: string,
  a: IAutoMoviePose,
  b: IAutoMoviePose,
  t: number,
) => IAutoMoviePose = (
  skeleton: string,
  a: IAutoMoviePose,
  b: IAutoMoviePose,
  t: number,
): IAutoMoviePose => {
  const aJoints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    a.joints.map(
      (
        j: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
    ),
  );
  const bJoints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    b.joints.map(
      (
        j: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
    ),
  );
  const bones: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
    ...aJoints.keys(),
    ...bJoints.keys(),
  ]);

  const joints: IAutoMovieJointPose[] = [];
  for (const bone of bones) {
    const ja: IAutoMovieJointPose | undefined = aJoints.get(bone);
    const jb: IAutoMovieJointPose | undefined = bJoints.get(bone);
    joints.push({
      bone,
      flexion: lerpAxis(ja?.flexion ?? null, jb?.flexion ?? null, t),
      abduction: lerpAxis(ja?.abduction ?? null, jb?.abduction ?? null, t),
      twist: lerpAxis(ja?.twist ?? null, jb?.twist ?? null, t),
    });
  }

  return {
    skeleton,
    root: lerpTransform(a.root, b.root, t),
    joints,
  };
};

/**
 * Interpolate one axis; `null` is treated as 0 but preserved when both sides
 * are null.
 */
const lerpAxis: (
  a: number | null,
  b: number | null,
  t: number,
) => number | null = (
  a: number | null,
  b: number | null,
  t: number,
): number | null => {
  if (a === null && b === null) return null;
  return (a ?? 0) + ((b ?? 0) - (a ?? 0)) * t;
};

const lerpTransform: (
  a: IAutoMovieTransform | null,
  b: IAutoMovieTransform | null,
  t: number,
) => IAutoMovieTransform | null = (
  a: IAutoMovieTransform | null,
  b: IAutoMovieTransform | null,
  t: number,
): IAutoMovieTransform | null => {
  if (a === null && b === null) return null;
  const ta: IAutoMovieTransform = a ?? IDENTITY_TRANSFORM;
  const tb: IAutoMovieTransform = b ?? IDENTITY_TRANSFORM;
  return {
    translation: Vector3.lerp(ta.translation, tb.translation, t),
    rotation: Quaternion.slerp(ta.rotation, tb.rotation, t),
    scale: Vector3.lerp(ta.scale, tb.scale, t),
  };
};

const interpolateExpression: (
  a: IAutoMovieExpression | null,
  b: IAutoMovieExpression | null,
  t: number,
) => IAutoMovieExpression | null = (
  a: IAutoMovieExpression | null,
  b: IAutoMovieExpression | null,
  t: number,
): IAutoMovieExpression | null => {
  // `null` is the NEUTRAL side (intensity 0 of the authored preset), blended
  // toward like a resting joint axis (`lerpAxis` null → 0) or a resting
  // transform (`lerpTransform` null → identity), the same "unauthored side"
  // convention this file uses everywhere else. An expression authored only at
  // the far keyframe therefore RAMPS in from neutral instead of popping to full
  // at the segment start, and one authored only at the near keyframe fades out
  // to neutral (#1245-round-2 R2-8). Only when neither side is authored is there
  // no expression to sample.
  if (a === null && b === null) return null;
  const ea: IAutoMovieExpression = a ?? neutral(b!.preset);
  const eb: IAutoMovieExpression = b ?? neutral(a!.preset);
  // Same preset → blend smoothly; differing presets → switch at the midpoint.
  if (ea.preset !== eb.preset) return t < 0.5 ? ea : eb;
  return {
    preset: ea.preset,
    intensity: ea.intensity + (eb.intensity - ea.intensity) * t,
    blendshapes: blendChannels(ea, eb, t),
  };
};

/** The rest expression of a preset: present but with zero intensity/channels. */
const neutral: (preset: AutoMovieExpressionPreset) => IAutoMovieExpression = (
  preset: AutoMovieExpressionPreset,
): IAutoMovieExpression => ({
  preset,
  intensity: 0,
  blendshapes: null,
});

const blendChannels: (
  a: IAutoMovieExpression,
  b: IAutoMovieExpression,
  t: number,
) => IAutoMovieBlendshapeChannel[] | null = (
  a: IAutoMovieExpression,
  b: IAutoMovieExpression,
  t: number,
): IAutoMovieBlendshapeChannel[] | null => {
  if (a.blendshapes === null && b.blendshapes === null) return null;
  const weights: Map<AutoMovieArkitChannel, number> = new Map();
  for (const c of a.blendshapes ?? [])
    weights.set(c.channel, c.weight * (1 - t));
  for (const c of b.blendshapes ?? [])
    weights.set(c.channel, (weights.get(c.channel) ?? 0) + c.weight * t);
  return [...weights].map(
    ([channel, weight]: [
      AutoMovieArkitChannel,
      number,
    ]): IAutoMovieBlendshapeChannel => ({ channel, weight }),
  );
};
