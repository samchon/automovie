import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointRotationDomain,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieSolvePreparedChainPlantProps,
  IAutoMovieSolvedChainPlant,
  IAutoMovieTwoBoneArticulation,
} from "@automovie/interface";

import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { twoBoneChainArticulation } from "../kinematics/twoBoneChainArticulation";
import type { prepareChainFit } from "./prepareChainFit";

/**
 * Solve one prepared two-bone chain for a model-metre target and bend normal. Return null when analytic articulation is unavailable; otherwise decompose upper and lower rotations through the same prepared clinical domains used by residual FK.
 * An optional rig context must belong to these exact unchanged axes, rest
 * frames, skeleton and source preparation; it shares basis admission, not a solve.
 * A supplied target must be the actual twoBoneChainArticulation.prepare
 * source's target reader for these exact unchanged resolved frames and point;
 * it shares completed geometric preparation, never a candidate articulation.
 *
 * @evidence contracts/development/implementation.md#principled-implementation twoBoneChainArticulation solves the supplied rest geometry, then decomposeJointRotation maps its two quaternions through the caller's axes/rest frames and prepared domains; the unchanged preparation supplies compatible constraints.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The helper evaluates one bend candidate, leaving candidate search, continuity and constrained residual selection to fitChainToTarget.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts It neither clamps a failing target into a reported success nor substitutes different rest geometry; null from the analytic solve is propagated.
 * @evidence contracts/development/common.md#meaningful-documentation Documents model metres, prepared-domain identity, returned hinge and null failure rather than a global IK-optimality claim.
 * @evidence contracts/development/implementation.md#efficient-algorithms One actual bend-normal articulation and two bounded joint-domain decompositions remain per candidate. A supplied exact source/target reader avoids repeated lengths, rest directions, reach axis/lift and fixed frame inverses; the direct path derives those itself. No per-candidate decomposition closure is allocated, and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Endpoints/domains and a supplied actual matching source/target geometry reader share only completed invariant work. An optional matching rig admits each clinical basis once at the original post-analytic site. Every candidate is articulated and decomposed; null admission never reads a basis, and no callback or candidate answer is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned articulation records; preparation and input maps are borrowed and the helper retains no solver workspace or resource.
 */
export const solvePreparedChainPlant: (
  props: IAutoMovieSolvePreparedChainPlantProps,
  rig?: prepareChainFit.IRig,
  target?: twoBoneChainArticulation.IPreparedTarget,
) => IAutoMovieSolvedChainPlant | null = (
  props: IAutoMovieSolvePreparedChainPlantProps,
  rig?: prepareChainFit.IRig,
  target?: twoBoneChainArticulation.IPreparedTarget,
): IAutoMovieSolvedChainPlant | null => {
  const { chain, upper, lower }: IAutoMoviePreparedChainPlant = props.prepared;

  const articulation: IAutoMovieTwoBoneArticulation | null =
    target === undefined
      ? twoBoneChainArticulation({
          upper,
          lower,
          end: props.prepared.end,
          target: props.target,
          bendNormal: props.bendNormal,
        })
      : target.solve(props.bendNormal);
  if (articulation === null) return null;

  return {
    hinge: props.prepared.hinge,
    upper: {
      bone: chain.upper,
      ...angles(
        props,
        rig,
        chain.upper,
        articulation.upper,
        props.prepared.upperDomain,
      ),
    },
    lower: {
      bone: chain.lower,
      ...angles(
        props,
        rig,
        chain.lower,
        articulation.lower,
        props.prepared.lowerDomain,
      ),
    },
  };
};

/** Keep each clinical decomposition at its original post-geometry site without a new closure per candidate. */
function angles(
  props: IAutoMovieSolvePreparedChainPlantProps,
  rig: prepareChainFit.IRig | undefined,
  bone: AutoMovieHumanoidBone,
  rotation: IAutoMovieQuaternion,
  domain: IAutoMovieJointRotationDomain,
): IAutoMovieResolvedJointAngles {
  return rig === undefined
    ? decomposeJointRotation(
        rotation,
        props.jointAxes?.[bone],
        props.restFrames?.[bone],
        domain,
      )
    : decomposeJointRotationOnBasis(
        rotation,
        rig.jointBasis(bone, "decomposeJointRotation axes"),
        props.restFrames?.[bone],
        domain,
      );
}
