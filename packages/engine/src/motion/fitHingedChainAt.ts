import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHingedArmSwivel,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSeededChainFit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { orientChainEffector } from "./orientChainEffector";
import { prepareHingedChainAt } from "./prepareHingedChainAt";

/**
 * A hinged two-bone chain posed at a prescribed swivel and bend branch, with
 * no search, score or continuation: the closed-form articulation a caller
 * that chooses its own swivel (an arm course) evaluates.
 *
 * The request is the fit's own (`IFitChainToTargetProps`); its `near`,
 * `strain`, reference and bend hint are not read, since the swivel is
 * given. Its `obstruction` is read once, at the placed mid and end joints,
 * exactly as the hinged fit reads a candidate (`fitHingedChainCandidate`),
 * so a caller can tell a placement that passes through what the fit keeps
 * clear of. The hinge angle of the chosen branch comes from the span
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
 * @returns The posed chain, its seed, the shortfall from the target on the legal shell, metres, whether the range of motion moved a joint off the swivel's pose, and the obstruction's reading there; null when the chain is not a hinged two-bone chain or is degenerate.
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
): fitHingedChainAt.IPlaced | null {
  const at: prepareHingedChainAt.IPrepared | null = prepareHingedChainAt(props);
  if (at === null) return null;
  const index: number = Math.min(
    Math.max(0, Math.round(branch)),
    at.branches.length - 1,
  );
  const stop: IAutoMovieHingedArmSwivel.IStop = at.branches[index]!;
  const posed: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
    hingedArmSwivel.pose(at.chain, stop.theta)(swivel);
  const free: readonly [IAutoMovieJointPose, IAutoMovieJointPose] = [
    {
      bone: props.chain.upper,
      ...decomposeJointRotationOnBasis(
        posed.upper,
        at.upperBasis,
        props.restFrames?.[props.chain.upper],
        at.prepared.upperDomain,
      ),
    },
    {
      bone: props.chain.lower,
      ...decomposeJointRotationOnBasis(
        posed.lower,
        at.lowerBasis,
        props.restFrames?.[props.chain.lower],
        at.prepared.lowerDomain,
      ),
    },
  ];
  const upper: IAutoMovieJointPose = at.workspace.clamp(free[0]);
  const lower: IAutoMovieJointPose = at.workspace.clamp(free[1]);
  // Whether the range of motion moved either joint off the swivel's own
  // pose, which moves the end joint off the target.
  const moved = (a: IAutoMovieJointPose, b: IAutoMovieJointPose): boolean =>
    Math.abs((a.flexion ?? 0) - (b.flexion ?? 0)) > 1e-9 ||
    Math.abs((a.abduction ?? 0) - (b.abduction ?? 0)) > 1e-9 ||
    Math.abs((a.twist ?? 0) - (b.twist ?? 0)) > 1e-9;

  // The obstruction at the swivel's own mid and end joints in world space,
  // composed as the hinged fit composes a candidate's.
  let blocked: number = 0;
  if (props.obstruction !== undefined) {
    const turned: IAutoMovieQuaternion = Quaternion.multiply(
      at.prepared.upper.worldRotation,
      posed.upper,
    );
    const mid: IAutoMovieVector3 = Vector3.add(
      at.prepared.upper.worldPosition,
      Quaternion.rotateVector(turned, at.prepared.lowerOffset),
    );
    const end: IAutoMovieVector3 = Vector3.add(
      mid,
      Quaternion.rotateVector(
        Quaternion.multiply(
          Quaternion.multiply(turned, at.prepared.lowerRotation),
          posed.lower,
        ),
        at.prepared.effectorOffset,
      ),
    );
    blocked = props.obstruction(mid, end);
  }
  return {
    pose: orientChainEffector(
      props,
      at.workspace.pose(upper, lower),
      at.prepared,
      at.workspace.rig,
    ),
    seed: { swivel, branch: index },
    shortfall: stop.shortfall,
    clamped: moved(free[0], upper) || moved(free[1], lower),
    blocked,
  };
}

/**
 * Companion types of `fitHingedChainAt`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The placed record states each member's meaning and unit.
 * @evidence contracts/development/design.md#principled-representation The fit's own result with the facts that tell whether the end joint reached the target, cleared the obstruction and stayed off the range's clamp.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by its callers to decide whether the placement stands.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends the seeded fit record rather than restating it.
 */
export namespace fitHingedChainAt {
  /** A chain placed at a swivel. */
  export interface IPlaced extends IAutoMovieSeededChainFit {
    /** How far the target lies beyond the branch's legal shell, metres. */
    shortfall: number;

    /** Whether the range of motion moved a joint off the swivel's own pose. */
    clamped: boolean;

    /** The request's obstruction read at the swivel's own mid and end joints (`IAutoMovieFitChainToTargetProps.obstruction`); 0 without one, positive where the chain passes through what the fit keeps clear of. */
    blocked: number;
  }
}
