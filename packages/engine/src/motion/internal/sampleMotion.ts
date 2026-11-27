import {
  AutoMovieArkitChannel,
  AutoMovieExpressionPreset,
  AutoMovieHumanoidBone,
  IAutoMovieBlendshapeChannel,
  IAutoMovieExpression,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  type IAutoMovieMotionSample,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";

import { AutoMovieEngineKeyframeSearch } from "../../math/AutoMovieEngineKeyframeSearch";
import { Quaternion } from "../../math/Quaternion";
import { Transform } from "../../math/Transform";
import { Vector3 } from "../../math/Vector3";
import { normalizeClipTime } from "../../math/internal/normalizeClipTime";
import { cubicBezierEasing } from "./cubicBezierEasing";
import { ease } from "./ease";

const IDENTITY_TRANSFORM: IAutoMovieTransform = Transform.identity();

/** Pose and root projections for geometry and world placement. */
export namespace sampleMotion {
  /**
   * Sample caller-admitted clinical motion at finite seconds using clamped or
   * looping clip time and the outgoing segment's easing. Ordered finite keyframes
   * and valid pose/easing data are validateMotion's premise. End samples
   * shallowly share frame data; interior samples interpolate joints, roots and
   * expressions, treating unauthored values as neutral.
   */
  export function sample(
    motion: IAutoMovieMotion,
    seconds: number,
  ): IAutoMovieMotionSample {
    return readAt(motion, seconds, toSample, between);
  }

  /**
   * Sample the clinical pose of admitted motion at clip-local seconds. This
   * uses the full sample's skeleton, joint order, easing and neutral values.
   * Endpoint pose wrappers borrow their key's joints and root.
   */
  export function pose(
    motion: IAutoMovieMotion,
    seconds: number,
  ): IAutoMoviePose {
    return readAt(motion, seconds, poseAtKey, poseBetween);
  }

  /** Sample the root of an admitted motion, borrowing endpoint transforms. */
  export function root(
    motion: IAutoMovieMotion,
    seconds: number,
  ): IAutoMovieTransform | null {
    return readAt(motion, seconds, rootAtKey, rootBetween);
  }
}

/**
 * Select the clamped or wrapped key or eased segment for the requested
 * projection.
 */
function readAt<T>(
  motion: IAutoMovieMotion,
  seconds: number,
  endpoint: (motion: IAutoMovieMotion, key: IAutoMovieKeyframe) => T,
  interior: (
    motion: IAutoMovieMotion,
    lo: IAutoMovieKeyframe,
    hi: IAutoMovieKeyframe,
    t: number,
  ) => T,
): T {
  const frames: IAutoMovieKeyframe[] = motion.keyframes;
  if (frames.length === 0)
    throw new Error(`motion "${motion.id}" must have keyframes to sample`);

  const time: number = normalizeClipTime(seconds, motion.duration, motion.loop);

  if (time <= frames[0]!.time) return endpoint(motion, frames[0]!);
  const last: IAutoMovieKeyframe = frames[frames.length - 1]!;
  if (time >= last.time) return endpoint(motion, last);

  // Precondition: the clip has strictly increasing keyframe times (the contract
  // validateMotion enforces), so the binary search lands on a segment with a
  // positive span, and its tie rule matches the old linear scan exactly.
  const loIdx: number = AutoMovieEngineKeyframeSearch.segment(
    frames.length,
    (i: number): number => frames[i]!.time,
    time,
    "previous",
  );
  const lo: IAutoMovieKeyframe = frames[loIdx]!;
  const hi: IAutoMovieKeyframe = frames[loIdx + 1]!;
  const span: number = hi.time - lo.time;
  const linearT: number = (time - lo.time) / span;
  const t: number =
    lo.easing === "cubicBezier" && lo.bezier !== null
      ? cubicBezierEasing(lo.bezier, linearT)
      : ease(lo.easing, linearT);

  return interior(motion, lo, hi, t);
}

function poseAtKey(
  motion: IAutoMovieMotion,
  key: IAutoMovieKeyframe,
): IAutoMoviePose {
  return { ...key.pose, skeleton: motion.skeleton };
}

function poseBetween(
  motion: IAutoMovieMotion,
  lo: IAutoMovieKeyframe,
  hi: IAutoMovieKeyframe,
  t: number,
): IAutoMoviePose {
  return interpolatePose(motion.skeleton, lo.pose, hi.pose, t);
}

function rootAtKey(
  _motion: IAutoMovieMotion,
  key: IAutoMovieKeyframe,
): IAutoMovieTransform | null {
  return key.pose.root;
}

function rootBetween(
  _motion: IAutoMovieMotion,
  lo: IAutoMovieKeyframe,
  hi: IAutoMovieKeyframe,
  t: number,
): IAutoMovieTransform | null {
  return lerpTransform(lo.pose.root, hi.pose.root, t);
}

function between(
  motion: IAutoMovieMotion,
  lo: IAutoMovieKeyframe,
  hi: IAutoMovieKeyframe,
  t: number,
): IAutoMovieMotionSample {
  return {
    pose: poseBetween(motion, lo, hi, t),
    expression: interpolateExpression(lo.expression, hi.expression, t),
  };
}

const toSample: (
  motion: IAutoMovieMotion,
  frame: IAutoMovieKeyframe,
) => IAutoMovieMotionSample = (
  motion: IAutoMovieMotion,
  frame: IAutoMovieKeyframe,
): IAutoMovieMotionSample => ({
  pose: poseAtKey(motion, frame),
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
