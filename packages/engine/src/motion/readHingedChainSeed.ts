import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHingedArmSwivel,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { prepareHingedChainAt } from "./prepareHingedChainAt";

/**
 * The swivel and bend branch of a posed hinged chain, in the frame the fit's
 * seeds, `IAutoMovieSwivelNear` and `fitHingedChainAt` use.
 *
 * The branch is the one whose hinge articulation is nearest the given mid
 * joint's; the swivel is the root's turn about the root-to-target line past
 * the aim of that branch (`hingedArmSwivel.read`); the twist is the mid
 * joint's own, where it has one. The request's target is the effector's
 * place in the posed chain.
 *
 * @param props The fit request, its target where the posed effector lies.
 * @param upper The posed root joint, clinical degrees.
 * @param lower The posed mid joint, clinical degrees.
 * @returns The seed; null when the chain is not a hinged two-bone chain or is degenerate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the branch, swivel and twist readings and the null cases.
 * @evidence contracts/development/implementation.md#principled-implementation The inverse of fitHingedChainAt's pose: the joints composed through the same clinical bases, the branch by the least angle between hinge articulations, the swivel by the chain's own reader.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure prepareHingedChainAt owns the preparation; this composes, picks the branch and reads the swivel.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No search; a degenerate chain declines.
 * @evidence contracts/development/implementation.md#efficient-algorithms One preparation, two compositions, at most two branch poses and one swivel reading.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads its own request.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function readHingedChainSeed(
  props: IAutoMovieFitChainToTargetProps,
  upper: IAutoMovieJointPose,
  lower: IAutoMovieJointPose,
): IAutoMovieSwivelSeed | null {
  const at: prepareHingedChainAt.IPrepared | null = prepareHingedChainAt(props);
  if (at === null) return null;
  const root: IAutoMovieQuaternion = jointToQuaternionOnBasis(upper, at.upperBasis, props.restFrames?.[props.chain.upper]);
  const mid: IAutoMovieQuaternion = jointToQuaternionOnBasis(lower, at.lowerBasis, props.restFrames?.[props.chain.lower]);
  let branch: number = 0;
  let nearest: number = Infinity;
  at.branches.forEach((stop: IAutoMovieHingedArmSwivel.IStop, index: number): void => {
    const apart: number = Quaternion.angle(hingedArmSwivel.pose(at.chain, stop.theta)(0).lower, mid);
    if (apart < nearest) {
      nearest = apart;
      branch = index;
    }
  });
  return {
    swivel: hingedArmSwivel.read(at.chain, root, at.branches[branch]!.theta),
    branch,
    // The mid joint's distal twist, which a fit continued from the seed
    // keeps the basin of (`IAutoMovieSwivelSeed.twist`).
    ...(typeof lower.twist === "number" ? { twist: lower.twist } : {}),
  };
}
