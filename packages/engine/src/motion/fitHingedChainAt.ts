import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHingedArmSwivel,
  IAutoMovieJointPose,
  IAutoMovieSeededChainFit,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { orientChainEffector } from "./orientChainEffector";
import { prepareHingedChainAt } from "./prepareHingedChainAt";

/**
 * A hinged two-bone chain posed at a prescribed swivel and bend branch, with
 * no search, score or continuation: the closed-form articulation a caller
 * that chooses its own swivel (an arm course) evaluates.
 *
 * The request is the fit's own (`IFitChainToTargetProps`); its `near`,
 * `strain`, `obstruction`, reference and bend hint are not read, since the
 * swivel is given. The hinge angle of the chosen branch comes from the span
 * (`hingedArmSwivel.branches`, each branch stopped on the legal shell when the
 * target lies outside the hinge's range), the root is aimed and turned by the
 * swivel (`hingedArmSwivel.pose`), both joints are decomposed through the
 * fit's own clinical domains and clamped by its ROM clamp, and a requested
 * effector rotation is laid by the fit's own final orientation
 * (`orientChainEffector`: the distal twist split and the end joint's range
 * projection), the tail of the hinged fit for one candidate.
 *
 * @param props The fit request: source pose, chain, rig tables and target; an optional effector rotation.
 * @param swivel The swivel, degrees, in the frame `IAutoMovieSwivelNear` and the fit's seeds use.
 * @param branch The bend branch, 0 or 1; clamped to the branches the target has.
 * @returns The posed chain, its seed and the shortfall from the target on the legal shell, metres; null when the chain is not a hinged two-bone chain or is degenerate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the inputs read and ignored, the swivel frame, the result and the null cases.
 * @evidence contracts/development/implementation.md#principled-implementation Tolani, Goswami and Badler 2000: the hinge angle is fixed by the span and the swivel is the remaining degree of freedom, so a given swivel determines the chain in closed form; the decomposition, clamp and orientation are the fit's own owners.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure prepareHingedChainAt owns the preparation; this pose one branch at one swivel, decomposes and clamps both joints, and orients the end joint.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No candidate is scored and no other swivel is visited; an unreachable target reports its shortfall rather than claiming a reach.
 * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation, one branch root solve and one pose, two decompositions and clamps, and one final orientation: constant work per call.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call evaluates its own request.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the preparation ends with the call.
 */
export function fitHingedChainAt(
  props: IAutoMovieFitChainToTargetProps,
  swivel: number,
  branch: number,
): (IAutoMovieSeededChainFit & { shortfall: number }) | null {
  const at: prepareHingedChainAt.IPrepared | null = prepareHingedChainAt(props);
  if (at === null) return null;
  const index: number = Math.min(Math.max(0, Math.round(branch)), at.branches.length - 1);
  const stop: IAutoMovieHingedArmSwivel.IStop = at.branches[index]!;
  const posed: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> = hingedArmSwivel.pose(at.chain, stop.theta)(swivel);
  const upper: IAutoMovieJointPose = at.workspace.clamp({
    bone: props.chain.upper,
    ...decomposeJointRotationOnBasis(posed.upper, at.upperBasis, props.restFrames?.[props.chain.upper], at.prepared.upperDomain),
  });
  const lower: IAutoMovieJointPose = at.workspace.clamp({
    bone: props.chain.lower,
    ...decomposeJointRotationOnBasis(posed.lower, at.lowerBasis, props.restFrames?.[props.chain.lower], at.prepared.lowerDomain),
  });
  return {
    pose: orientChainEffector(props, at.workspace.pose(upper, lower), at.prepared, at.workspace.rig),
    seed: { swivel, branch: index },
    shortfall: stop.shortfall,
  };
}
