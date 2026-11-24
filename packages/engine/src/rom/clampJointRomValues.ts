import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
} from "@automovie/interface";

import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { abductionRange } from "./abductionRange";
import { swingConeBlend } from "./swingConeBlend";

/**
 * Project one joint, given as its bone and its three clinical angles, into its
 * admitted range: the projection `clampJointRom` documents, read from the
 * angles themselves so a writer that has them (a posture's assembly) makes the
 * projected record without first making the record it projects. Specified
 * nonfinite angles first become neutral, null rest stays null, an immobile axis
 * is forced to zero and a swing cap blends toward the box point nearest
 * neutral; a ball joint gated by swing and twist is brought into its range as a
 * rotation and read back in the reading the box prefers, a joint already inside
 * coming back as given.
 *
 * @param bone The joint's bone.
 * @param flexion Its flexion, degrees, or null at rest.
 * @param abduction Its abduction, degrees, or null at rest.
 * @param twist Its twist, degrees, or null at rest.
 * @param constraint Its resolved range.
 * @param rig The bone's frame as the caller's rig resolves it; the humanoid
 *   tables' when absent.
 * @returns A fresh joint record in range.
 */
export function clampJointRomValues(
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null,
  twist: number | null,
  constraint: IAutoMovieJointConstraint,
  rig?: swingTwistRange.IPrepared,
): IAutoMovieJointPose {
  return clampJointRomValues.into(
    bone,
    flexion,
    abduction,
    twist,
    constraint,
    rig,
    undefined,
  );
}

/** The record form's entry. */
export namespace clampJointRomValues {
  /**
   * The same projection, handing back `input`, the record the angles were read
   * from, where the projected angles are its own (`Object.is` each): a clamp
   * output is a value, as an admitted record is, so a record already in range
   * is its own clamp. Absent, a fresh record is returned.
   *
   * @param bone The joint's bone.
   * @param flexion Its flexion, degrees, or null at rest.
   * @param abduction Its abduction, degrees, or null at rest.
   * @param twist Its twist, degrees, or null at rest.
   * @param constraint Its resolved range.
   * @param rig The bone's frame as the caller's rig resolves it.
   * @param input The record of these angles, when the caller has one.
   * @returns The record in range: `input` itself when nothing moved.
   */
  export function into(
    bone: AutoMovieHumanoidBone,
    flexion: number | null,
    abduction: number | null,
    twist: number | null,
    constraint: IAutoMovieJointConstraint,
    rig: swingTwistRange.IPrepared | undefined,
    input: IAutoMovieJointPose | undefined,
  ): IAutoMovieJointPose {
    return project(bone, flexion, abduction, twist, constraint, rig, input);
  }
}

/**
 * The input record where the projected angles are its own, else a fresh record
 * of them.
 */
function record(
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null,
  twist: number | null,
  input: IAutoMovieJointPose | undefined,
): IAutoMovieJointPose {
  return input !== undefined &&
    Object.is(input.flexion, flexion) &&
    Object.is(input.abduction, abduction) &&
    Object.is(input.twist, twist)
    ? input
    : { bone, flexion, abduction, twist };
}

/** The projection of `clampJointRomValues`, with the record form's input. */
function project(
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null,
  twist: number | null,
  constraint: IAutoMovieJointConstraint,
  rig: swingTwistRange.IPrepared | undefined,
  input: IAutoMovieJointPose | undefined,
): IAutoMovieJointPose {
  // A ball joint gated by swing and twist is brought into its range as a
  // rotation (`swingTwistRange.project`) and read back in the reading the
  // three-angle box prefers.
  const range: swingTwistRange.IPrepared | undefined =
    constraint.swingTwist === undefined || constraint.swingTwist === null
      ? undefined
      : (rig ?? swingTwistRange.humanoid(bone, constraint));
  if (range !== undefined) {
    const sanitized: IAutoMovieJointPose = record(
      bone,
      flexion,
      abduction,
      twist,
      input,
    );
    const q: IAutoMovieQuaternion = jointToQuaternion(
      sanitized,
      range.axes,
      range.frame,
    );
    // A joint on the range's edge within a rounding error is inside, so a
    // clamped joint clamps to itself.
    if (swingTwistRange.overshoot(q, constraint, range) <= EDGE)
      return sanitized;
    const projected: IAutoMovieQuaternion = swingTwistRange.project(
      q,
      constraint,
      range,
    );
    const read: IAutoMovieResolvedJointAngles = decomposeJointRotation(
      projected,
      range.axes,
      range.frame,
      { bone, constraint },
    );
    return {
      bone,
      flexion: read.flexion,
      abduction: read.abduction,
      twist: read.twist,
    };
  }
  const f: number | null = clampAxis(flexion, constraint.flexion);
  // A hip's abduction ceiling rises with its flexion (`abductionRange`).
  const a: number | null = clampAxis(abduction, abductionRange(constraint, f));
  const t: number | null = clampAxis(twist, constraint.twist);
  // Ball-joint swing cone: pull a corner pose back onto the cone. The cone is a
  // COUPLING between the two axes, not a per-axis check, so a resting (`null`)
  // axis is not exempt from it. It contributes its actual rotation, 0, exactly
  // as the renderer reads it (`jointToQuaternion`'s `?? 0`). Gating the cone on
  // both axes being non-null let `{flexion:150, abduction:null}` keep an angle
  // its identical twin `{flexion:150, abduction:0}` was clamped out of (#1245).
  if (constraint.swingDeg !== undefined && constraint.swingDeg !== null) {
    const fv: number = f ?? 0;
    const av: number = a ?? 0;
    // Pull toward the box point nearest neutral rather than toward neutral
    // itself: for a box that excludes neutral, shrinking toward the origin
    // leaves the box (#1245). A resting axis anchors at its own rest, 0.
    const anchorF: number = f === null ? 0 : nearestNeutral(constraint.flexion);
    const anchorA: number =
      a === null ? 0 : nearestNeutral(constraint.abduction);
    const blend: number = swingConeBlend(
      fv,
      av,
      anchorF,
      anchorA,
      constraint.swingDeg,
    );
    return record(
      bone,
      // A resting axis stays resting: blending 0 toward its own 0 rest is 0.
      f === null ? null : anchorF + (fv - anchorF) * blend,
      a === null ? null : anchorA + (av - anchorA) * blend,
      t,
      input,
    );
  }
  return record(bone, f, a, t, input);
}

/**
 * One axis into its interval: null rest stays null, an immobile axis (no
 * interval) goes to neutral.
 */
function clampAxis(
  angle: number | null,
  allowed: IAutoMovieAngleRange | null,
): number | null {
  if (angle === null) return null;
  if (allowed === null) return 0; // immobile axis: forced back to neutral
  return angle < allowed.min
    ? allowed.min
    : angle > allowed.max
      ? allowed.max
      : angle;
}

/**
 * How far past a swing-twist range a joint may lie and count as on its edge,
 * degrees: a millionth, above the rounding of a rotation read back into
 * angles.
 */
const EDGE: number = 1e-6;

/**
 * The point of `allowed` closest to neutral: neutral itself when the range
 * brackets it, else the nearer bound. This is the swing cone's pull target: the
 * joint's most-retracted reachable articulation on that axis.
 */
function nearestNeutral(allowed: IAutoMovieAngleRange | null): number {
  return allowed === null
    ? 0
    : allowed.min > 0
      ? allowed.min
      : allowed.max < 0
        ? allowed.max
        : 0;
}
