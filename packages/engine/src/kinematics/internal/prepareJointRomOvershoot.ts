import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { AutoMovieEngineJointRomScan } from "../../rom/internal/AutoMovieEngineJointRomScan";
import type { swingTwistRange } from "../swingTwistRange";
  /*
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
   * the range's own frame (`AutoMovieEngineJointRomScan.prepareJointRomScan`).
   */
export function prepareJointRomOvershoot(
  bone: AutoMovieHumanoidBone,
  constraint: IAutoMovieJointConstraint | null,
  rig?: swingTwistRange.IPrepared,
): (joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number {
  if (constraint === null)
    return (_joint: IAutoMovieJointPose, _rotation?: IAutoMovieQuaternion): number =>
      0;
  return AutoMovieEngineJointRomScan.prepareJointRomScan(bone, constraint, rig);
}