import type {
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieJointRotationFrame,
} from "@automovie/interface";

import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { clampJointRomValues } from "./clampJointRomValues";
import { swingConeBlend } from "./swingConeBlend";

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
): IAutoMovieJointPose =>
  clampJointRomValues(
    joint.bone,
    joint.flexion,
    joint.abduction,
    joint.twist,
    constraint,
    rig,
  );
