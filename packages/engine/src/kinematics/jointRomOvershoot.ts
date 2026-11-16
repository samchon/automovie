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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The direct null gate and prepare's one-bone scorer delegate to scanJointRom's shared fault scanner; prepared frame/composer ownership stays in scanJointRom.prepare, with no duplicate ROM rule.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no tolerance and no special case for any bone or axis; the `Infinity` score is the stated meaning of an unmeasurable violation, not a compensation.
 * @evidence contracts/development/common.md#meaningful-documentation States degree-valued exact gate scores, Infinity/null/rest meaning and prepare's fixed bone/constraint/frame scope, canonical fallback, lazy admission and caller-owned lifetime in its child documentation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Both paths retain actual finite/axis/swing checks and ordered additions. prepare's constant setup shares one lazy canonical or supplied gated basis/composer across the fixed-bone operation instead of repeating it per swivel; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Validation and both scoring entries share one scanner. prepare borrows an unchanged bone/constraint/frame and shares only that metadata and pure exact-angle factors; every joint still has its actual numerical scan and changed dependencies require another scorer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct scoring owns only a local sum. The caller owns one prepared scorer and optional bounded frame/composer until operation release; no joint answer, target history, global collection or handles are retained.
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
   * Every supplied joint must name the prepared bone. The scanner keeps its
   * canonical humanoid frame fallback when no rig is supplied and owns all
   * finite, interval, cone and swing-twist rules. Preparation adds no tolerance,
   * alternative frame or candidate-answer cache; each actual score is scanned.
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
