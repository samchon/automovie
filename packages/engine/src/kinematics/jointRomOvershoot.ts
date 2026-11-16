import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";

import { scanJointRom } from "../rom/scanJointRom";
import type { swingTwistRange } from "./swingTwistRange";

/**
 * The total range-of-motion overshoot of one joint's clinical angles, in
 * degrees, or `0` when the joint is within its constraint.
 *
 * It sums the overshoot of every fault {@link scanJointRom} reports, the
 * measure the pose gate's `validateJointRom` words into its violations, so a
 * solver that ranks candidates by this number cannot judge itself by a kinder
 * rule than the gate, and a ranking over hundreds of candidates builds no
 * message for any of them. A non-finite angle is reported without an
 * overshoot and scores `Infinity`, so it never wins a ranking. A `null`
 * constraint scores `0`.
 *
 * @param joint Clinical angles of one joint; `null` axes are at rest.
 * @param constraint The joint's resolved ROM, or `null` when unconstrained.
 * @param rig The bone's frame as the caller's rig resolves it, for a joint gated by swing and twist; the humanoid tables' when absent.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reduces the gate's own per-axis and swing-cone violations to one comparable sum, so ordering by it is ordering by the gate's distances; a violation without a measured distance is a non-finite angle, which the sum treats as infinitely far instead of free.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The null constraint gate delegates every actual score to scanJointRom.overshoot, whose private scan also reports validation faults; no ROM rule or sum is duplicated here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no tolerance and no special case for any bone or axis; the `Infinity` score is the stated meaning of an unmeasurable violation, not a compensation.
 * @evidence contracts/development/common.md#meaningful-documentation States the unit, the zero answer, that the gate's check is reused and why, the `Infinity` case, and what `null` means for the constraint and for an axis.
 * @evidence contracts/development/implementation.md#efficient-algorithms The same fixed axis/swing work and ordered fault additions remain, without a per-score summing callback closure, message or collector object. The shared scanner's fixed helper dispatch remains; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Validation and numerical scores execute the same scanner and fault order; each candidate is still measured independently, with no cached joint answer or alternate constraint.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the sum is a local number.
 */
export function jointRomOvershoot(
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint | null,
  rig?: swingTwistRange.IJoint,
): number {
  return constraint === null ? 0 : scanJointRom.overshoot(joint, constraint, rig);
}

/**
 * Repeated legality scores for one bone under unchanged effective ROM.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the fixed bone/constraint/frame scope and exact scalar score shared with the gate.
 * @evidence contracts/development/design.md#principled-representation One bone's unchanged ROM and clinical frame determine its legality independently of targets; each incoming clinical joint remains an actual scan input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hinged candidate scorer needs one upper and one lower legality reader, while scanJointRom remains the sole owner of finite, box, cone and swing-twist fault rules.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No cached candidate, alternate constraint, tolerance or skeleton identity is represented; callers release the scorer when its fixed inputs change.
 */
export namespace jointRomOvershoot {
  /**
   * Prepare the gate's exact overshoot sum for joints of one fixed bone.
   * The bone, constraint and optional frame stay unchanged for the scorer's
   * synchronous operation. A null constraint still scores zero without
   * admitting any coordinate. The scanner owns lazy prepared basis/factor
   * sharing for gated joints; every candidate retains its original finite
   * checks, numerical reading and fault order.
   *
   * Constant setup owns one closure and the scanner's fixed-size optional
   * frame/composer until caller release. No target or joint result survives
   * a score, and a changed rig or ROM requires a new scorer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States one-bone scope, null-constraint behavior, canonical-frame fallback and caller-owned lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Every constrained score runs the same scanJointRom fault rules and addition order; null ROM remains exactly zero without coordinate admission.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This scalar legality owner delegates prepared frame/composer sharing to scanJointRom.prepare, keeping numerical fault rules in one scanner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance, alternative clinical frame or candidate score is introduced or cached; the fixed bone must match every supplied joint.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant setup and scanner-owned fixed-size metadata avoid repeated gated basis work; each joint still receives its actual numerical scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged bone/constraint/frame metadata and pure exact-angle factors are shared; changed dependencies require a new operation scorer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one returned scorer and its optional prepared frame/composer until operation release, with no global collection, joint result, target history or handles.
   */
  export function prepare(
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
    rig?: swingTwistRange.IJoint,
  ): (joint: IAutoMovieJointPose) => number {
    return constraint === null
      ? (_joint: IAutoMovieJointPose): number => 0
      : scanJointRom.prepare(bone, constraint, rig);
  }
}
