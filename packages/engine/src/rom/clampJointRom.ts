import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  type IAutoMovieJointRotationFrame,
  type IAutoMovieResolvedJointAngles,
} from "@automovie/interface";

import { SwingTwistFramePreparation } from "../kinematics/SwingTwistFramePreparation";
import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { swingConeBlend } from "./swingConeBlend";

const clampAxis: (
  angle: number | null,
  allowed: IAutoMovieAngleRange | null,
) => number | null = (
  angle: number | null,
  allowed: IAutoMovieAngleRange | null,
): number | null => {
  if (angle === null) return null;
  if (allowed === null) return 0; // immobile axis: forced back to neutral
  const finiteAngle: number = Number.isFinite(angle) ? angle : 0;
  return finiteAngle < allowed.min
    ? allowed.min
    : finiteAngle > allowed.max
      ? allowed.max
      : finiteAngle;
};

/**
 * Project one joint into admitted axis intervals, preserving null rest and forcing specified immobile axes to zero. Specified nonfinite angles first become neutral. A swing cap blends toward the box point nearest neutral; unrestricted multi-turn overrides are outside the bisection's monotonic-segment guarantee.
 *
 * A ball joint whose constraint declares `swingTwist`, on a bone with axes in its frame (the caller's `rig`, or the humanoid tables' through `swingTwistRange.of`), is instead brought into its range as a rotation (`swingTwistRange.project`: its direction along its great circle from rest, its twist clamped) and read back in the reading the three-angle box prefers; a joint already inside comes back as given.
 *
 * @param joint The joint's clinical angles.
 * @param constraint Its resolved range.
 * @param rig The bone's frame as the caller's rig resolves it; the humanoid tables' when absent.
 * @returns The joint in range.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Project finite-or-repaired axes into admitted intervals, force specified immobile axes to zero, preserve null rest and blend swing toward the box-nearest-neutral point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Axis projection and combined swing are distinct constraints; swingConeBlend supplies fixed bisection and the result preserves bone identity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Specified nonfinite angles reset to neutral before box projection; unrestricted multi-turn overrides can violate swing monotonicity, so universal box/cone projection is not certified. For a swing-twist joint the edge tolerance `EDGE` (a millionth of a degree) only absorbs the rounding of reading a rotation back into angles, so a joint on the edge clamps to itself; it hides no real overshoot.
 * @evidence contracts/development/common.md#meaningful-documentation Docs identify nonfinite repair, null/immobile distinction, degrees and finite ordered constraint premise with remaining cone limitation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three clamps and at most forty fixed swing iterations cost constant work and one fixed-size result. A swing-twist joint costs one overshoot test and, only outside the range, one projection and one decomposition, reading the cached radius table. Explicit prepared frames share their one admitted basis instead of repeating raw-axis comparisons in composition and readback; ordinary frames retain both original admission calls. Runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Targeted/full-pose clamps reuse the same joint owner and borrow constraints; changed angles need new projection. Explicit unchanged-operation frames lend their lazy admitted axes to the existing OnBasis composition/inverse, keeping every clinical angle/frame check and the first admission's jointToQuaternion diagnostic. Swing-twist readback lends that same constraint to the inverse's shared box-preparation owner instead of cloning another box here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns a fresh joint record. Existing swing-region and inverse box metadata remain weakly keyed by their owning constraint/basis records; no projected answer, pose population, native handle or task is retained.
 */
export const clampJointRom: (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  rig?: IAutoMovieJointRotationFrame,
) => IAutoMovieJointPose = (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  rig?: IAutoMovieJointRotationFrame,
): IAutoMovieJointPose => {
  // A ball joint gated by swing and twist is brought into its range as a
  // rotation (`swingTwistRange.project`) and read back in the reading the
  // three-angle box prefers.
  const range: IAutoMovieJointRotationFrame | undefined =
    constraint.swingTwist === undefined || constraint.swingTwist === null
      ? undefined
      : (rig ?? swingTwistRange.of(joint.bone));
  if (range !== undefined) {
    // A non-finite angle first becomes its rest, as on every other joint.
    const finite: (value: number | null) => number | null = (
      value: number | null,
    ): number | null => (value === null || Number.isFinite(value) ? value : 0);
    const sanitized: IAutoMovieJointPose = {
      bone: joint.bone,
      flexion: finite(joint.flexion),
      abduction: finite(joint.abduction),
      twist: finite(joint.twist),
    };
    const basis: IAutoMovieJointAxes | undefined =
      SwingTwistFramePreparation.normalized(range, "jointToQuaternion axes");
    const q: IAutoMovieQuaternion =
      basis === undefined
        ? jointToQuaternion(sanitized, range.axes, range.frame)
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
            bone: joint.bone,
            constraint,
          })
        : decomposeJointRotationOnBasis(projected, basis, range.frame, {
            bone: joint.bone,
            constraint,
          });
    return {
      bone: joint.bone,
      flexion: read.flexion,
      abduction: read.abduction,
      twist: read.twist,
    };
  }
  const flexion: number | null = clampAxis(joint.flexion, constraint.flexion);
  const abduction: number | null = clampAxis(
    joint.abduction,
    constraint.abduction,
  );
  const twist: number | null = clampAxis(joint.twist, constraint.twist);
  // Ball-joint swing cone: pull a corner pose back onto the cone. The cone is a
  // COUPLING between the two axes, not a per-axis check, so a resting (`null`)
  // axis is not exempt from it. It contributes its actual rotation, 0, exactly
  // as the renderer reads it (`jointToQuaternion`'s `?? 0`). Gating the cone on
  // both axes being non-null let `{flexion:150, abduction:null}` keep an angle
  // its identical twin `{flexion:150, abduction:0}` was clamped out of (#1245).
  if (typeof constraint.swingDeg === "number") {
    const f: number = flexion ?? 0;
    const a: number = abduction ?? 0;
    // Pull toward the box point nearest neutral rather than toward neutral
    // itself: for a box that excludes neutral, shrinking toward the origin
    // leaves the box (#1245). A resting axis anchors at its own rest, 0.
    const anchorF: number =
      flexion === null ? 0 : nearestNeutral(constraint.flexion);
    const anchorA: number =
      abduction === null ? 0 : nearestNeutral(constraint.abduction);
    const t: number = swingConeBlend(
      f,
      a,
      anchorF,
      anchorA,
      constraint.swingDeg,
    );
    const blend: (value: number, anchor: number) => number = (
      value: number,
      anchor: number,
    ): number => anchor + (value - anchor) * t;
    return {
      bone: joint.bone,
      // A resting axis stays resting: blending 0 toward its own 0 rest is 0.
      flexion: flexion === null ? null : blend(f, anchorF),
      abduction: abduction === null ? null : blend(a, anchorA),
      twist,
    };
  }
  return { bone: joint.bone, flexion, abduction, twist };
};

/** How far past a swing-twist range a joint may lie and count as on its edge, degrees: a millionth, above the rounding of a rotation read back into angles. */
const EDGE: number = 1e-6;

/**
 * The point of `allowed` closest to neutral: neutral itself when the range
 * brackets it, else the nearer bound. This is the swing cone's pull target: the
 * joint's most-retracted reachable articulation on that axis.
 */
const nearestNeutral: (allowed: IAutoMovieAngleRange | null) => number = (
  allowed: IAutoMovieAngleRange | null,
): number =>
  allowed === null
    ? 0
    : allowed.min > 0
      ? allowed.min
      : allowed.max < 0
        ? allowed.max
        : 0;
