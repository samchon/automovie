import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieJointRotationFrame,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
} from "@automovie/interface";

import { SwingTwistFramePreparation } from "../kinematics/SwingTwistFramePreparation";
import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { abductionRange } from "./abductionRange";
import { swingConeBlend } from "./swingConeBlend";

/**
 * Project one joint, given as its bone and its three clinical angles, into
 * its admitted range: the projection `clampJointRom` documents, read from
 * the angles themselves so a writer that has them (a posture's assembly)
 * makes the projected record without first making the record it projects.
 * Specified nonfinite angles first become neutral, null rest stays null,
 * an immobile axis is forced to zero and a swing cap blends toward the box
 * point nearest neutral; a ball joint gated by swing and twist is brought
 * into its range as a rotation and read back in the reading the box prefers,
 * a joint already inside coming back as given.
 *
 * @param bone The joint's bone.
 * @param flexion Its flexion, degrees, or null at rest.
 * @param abduction Its abduction, degrees, or null at rest.
 * @param twist Its twist, degrees, or null at rest.
 * @param constraint Its resolved range.
 * @param rig The bone's frame as the caller's rig resolves it; the humanoid tables' when absent.
 * @returns A fresh joint record in range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the projection, its inputs' units and null meaning, and the fresh result.
 * @evidence contracts/development/implementation.md#principled-implementation Per-axis interval projection, the swing cone's blend toward the box point nearest neutral, and the swing-twist range's own projection read back on the joint's basis, as `clampJointRom` states them; each expression is the record form's, on the same operands, so the record is the same.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure `clampJointRom` reads a record's four fields and calls this; the arithmetic has one owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite angles reset to neutral before the box; the edge tolerance `EDGE` only absorbs read-back rounding; unrestricted multi-turn overrides remain outside the cone's bisection guarantee, as on the record form.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three clamps and at most forty fixed cone iterations, or one overshoot test and, outside the range, one projection and one decomposition; one result record and, for a gated joint, one sanitized record.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the caller's constraint and prepared frame; nothing is kept.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the fresh record; frame and box metadata stay with their weak owners.
 */
export function clampJointRomValues(
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null,
  twist: number | null,
  constraint: IAutoMovieJointConstraint,
  rig?: IAutoMovieJointRotationFrame,
): IAutoMovieJointPose {
  return clampJointRomValues.into(bone, flexion, abduction, twist, constraint, rig, undefined);
}

/**
 * The record form's entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when the input record is its own clamp.
 * @evidence contracts/development/design.md#principled-representation A clamp output is a value, as an admitted record is: equal angles are the same value, so the input stands for it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry, read by `clampJointRom`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The input is returned only where every projected angle is its own by `Object.is`; it is never edited.
 */
export namespace clampJointRomValues {
  /**
   * The same projection, handing back `input`, the record the angles were
   * read from, where the projected angles are its own (`Object.is` each):
   * a clamp output is a value, as an admitted record is, so a record
   * already in range is its own clamp. Absent, a fresh record is returned.
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
    rig: IAutoMovieJointRotationFrame | undefined,
    input: IAutoMovieJointPose | undefined,
  ): IAutoMovieJointPose {
    return project(bone, flexion, abduction, twist, constraint, rig, input);
  }
}

/** The input record where the projected angles are its own, else a fresh record of them. */
function record(
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null,
  twist: number | null,
  input: IAutoMovieJointPose | undefined,
): IAutoMovieJointPose {
  return input !== undefined && Object.is(input.flexion, flexion) &&
    Object.is(input.abduction, abduction) && Object.is(input.twist, twist)
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
  rig: IAutoMovieJointRotationFrame | undefined,
  input: IAutoMovieJointPose | undefined,
): IAutoMovieJointPose {
  // A ball joint gated by swing and twist is brought into its range as a
  // rotation (`swingTwistRange.project`) and read back in the reading the
  // three-angle box prefers.
  const range: IAutoMovieJointRotationFrame | undefined =
    constraint.swingTwist === undefined || constraint.swingTwist === null
      ? undefined
      : (rig ?? swingTwistRange.of(bone));
  if (range !== undefined) {
    // A non-finite angle first becomes its rest, as on every other joint.
    const sanitized: IAutoMovieJointPose = record(
      bone,
      finiteOrRest(flexion),
      finiteOrRest(abduction),
      finiteOrRest(twist),
      input,
    );
    const basis: IAutoMovieJointAxes | undefined =
      SwingTwistFramePreparation.normalized(range, "jointToQuaternion axes");
    // A prepared frame lends its composer, the same products with its
    // factors prepared once for the frame.
    const compose: ReturnType<typeof SwingTwistFramePreparation.composer> =
      basis === undefined ? undefined
        : SwingTwistFramePreparation.composer(range, "jointToQuaternion axes");
    const q: IAutoMovieQuaternion =
      basis === undefined
        ? jointToQuaternion(sanitized, range.axes, range.frame)
        : compose !== undefined
          ? compose(sanitized)
          : jointToQuaternionOnBasis(sanitized, basis, range.frame);
    // A joint on the range's edge within a rounding error is inside, so a
    // clamped joint clamps to itself.
    if (swingTwistRange.overshoot(q, constraint, range) <= EDGE)
      return sanitized;
    const projected: IAutoMovieQuaternion = swingTwistRange.project(
      q,
      constraint,
      range,
    );
    const read: IAutoMovieResolvedJointAngles =
      basis === undefined
        ? decomposeJointRotation(projected, range.axes, range.frame, {
            bone,
            constraint,
          })
        : decomposeJointRotationOnBasis(projected, basis, range.frame, {
            bone,
            constraint,
          });
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
  if (typeof constraint.swingDeg === "number") {
    const fv: number = f ?? 0;
    const av: number = a ?? 0;
    // Pull toward the box point nearest neutral rather than toward neutral
    // itself: for a box that excludes neutral, shrinking toward the origin
    // leaves the box (#1245). A resting axis anchors at its own rest, 0.
    const anchorF: number = f === null ? 0 : nearestNeutral(constraint.flexion);
    const anchorA: number = a === null ? 0 : nearestNeutral(constraint.abduction);
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

/** One axis into its interval: null rest stays null, an immobile axis (no interval) goes to neutral, a nonfinite angle first becomes neutral. */
function clampAxis(
  angle: number | null,
  allowed: IAutoMovieAngleRange | null,
): number | null {
  if (angle === null) return null;
  if (allowed === null) return 0; // immobile axis: forced back to neutral
  const finiteAngle: number = Number.isFinite(angle) ? angle : 0;
  return finiteAngle < allowed.min
    ? allowed.min
    : finiteAngle > allowed.max
      ? allowed.max
      : finiteAngle;
}

/** A specified angle as it is, or its rest (0) when it is not finite; a resting `null` stays resting. */
function finiteOrRest(value: number | null): number | null {
  return value === null || Number.isFinite(value) ? value : 0;
}

/** How far past a swing-twist range a joint may lie and count as on its edge, degrees: a millionth, above the rounding of a rotation read back into angles. */
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
