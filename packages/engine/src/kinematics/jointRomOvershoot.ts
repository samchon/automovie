import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { scanJointRom } from "../rom/scanJointRom";

/**
 * The total range-of-motion overshoot of one joint's clinical angles, in
 * degrees, or `0` when the joint is within its constraint.
 *
 * It sums the overshoot of every fault {@link scanJointRom} reports, the measure
 * the pose gate's `validateJointRom` words into its violations, so a solver
 * that ranks candidates by this number cannot judge itself by a kinder rule
 * than the gate, and a ranking over hundreds of candidates builds no message
 * for any of them. A non-finite angle is reported without an overshoot and
 * scores `Infinity`, so it never wins a ranking. A `null` constraint scores
 * `0`.
 *
 * @param joint Clinical angles of one joint; `null` axes are at rest.
 * @param constraint The joint's resolved ROM, or `null` when unconstrained.
 * @param rig The bone's frame as the caller's rig resolves it, for a joint
 *   gated by swing and twist; the humanoid tables' when absent.
 */
export function jointRomOvershoot(
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint | null,
  rig?: swingTwistRange.IPrepared,
): number {
  return constraint === null
    ? 0
    : scanJointRom.overshoot(joint, constraint, rig);
}

/** Repeated legality scores for one bone under unchanged effective ROM. */
export namespace jointRomOvershoot {
  /**
   * Prepare the gate's exact overshoot sum for joints of one fixed bone. The
   * bone, constraint and optional frame stay unchanged for the scorer's
   * synchronous operation. A null constraint still scores zero without
   * admitting any coordinate. The scanner owns lazy prepared basis/factor
   * sharing for gated joints; every candidate retains its original finite
   * checks, numerical reading and fault order.
   *
   * Constant setup owns one closure and the scanner's fixed-size optional
   * frame/composer until caller release. No target or joint result survives a
   * score, and a changed rig or ROM requires a new scorer.
   *
   * Every supplied joint must name the prepared bone. The scanner keeps its
   * canonical humanoid frame fallback when no rig is supplied and owns all
   * finite, interval, cone and swing-twist rules. Preparation adds no
   * tolerance, alternative frame or candidate-answer cache; each actual score
   * is scanned. The optional rotation is the one the angles were read from on
   * the range's own frame (`scanJointRom.prepare`).
   */
  export function prepare(
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
    rig?: swingTwistRange.IPrepared,
  ): (joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number {
    return constraint === null
      ? (
          _joint: IAutoMovieJointPose,
          _rotation?: IAutoMovieQuaternion,
        ): number => 0
      : scanJointRom.prepare(bone, constraint, rig);
  }
}
