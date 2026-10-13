import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import type { IAutoMovieTwoBoneArticulation } from "../kinematics/IAutoMovieTwoBoneArticulation";
import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { twoBoneChainArticulation } from "../kinematics/twoBoneChainArticulation";
import type { IAutoMovieSolvedChainPlant } from "./IAutoMovieSolvedChainPlant";
import type { ISolvePreparedChainPlantProps } from "./ISolvePreparedChainPlantProps";

/**
 * Solve one prepared two-bone chain for a model-metre target and bend normal. Return null when analytic articulation is unavailable; otherwise decompose upper and lower rotations through the same prepared clinical domains used by residual FK.
 *
 * @evidence contracts/common.md#principled-implementation twoBoneChainArticulation solves the supplied rest geometry, then decomposeJointRotation maps its two quaternions through the caller's axes/rest frames and prepared domains; the unchanged preparation supplies compatible constraints.
 * @evidence contracts/common.md#clear-and-simple-design The helper evaluates one bend candidate, leaving candidate search, continuity and constrained residual selection to fitChainToTarget.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It neither clamps a failing target into a reported success nor substitutes different rest geometry; null from the analytic solve is propagated.
 * @evidence contracts/common.md#meaningful-documentation Documents model metres, prepared-domain identity, returned hinge and null failure rather than a global IK-optimality claim.
 * @evidence contracts/performance.md#efficient-algorithms One analytic solve and two bounded joint-domain decompositions are performed per candidate; preparation and full-skeleton residual FK are not rebuilt here.
 * @evidence contracts/performance.md#reuse-equivalent-work The prepared chain's endpoints and domains are reused across bend candidates, preserving the same data in solver and residual readers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned articulation records; preparation and input maps are borrowed and the helper retains no solver workspace or resource.
 */
export const solvePreparedChainPlant: (props: ISolvePreparedChainPlantProps) => IAutoMovieSolvedChainPlant | null = (
  props: ISolvePreparedChainPlantProps,
): IAutoMovieSolvedChainPlant | null => {
  const { chain, upper, lower }: IPreparedChainPlant = props.prepared;

  const articulation: IAutoMovieTwoBoneArticulation | null = twoBoneChainArticulation({
    upper,
    lower,
    end: props.prepared.end,
    target: props.target,
    bendNormal: props.bendNormal,
  });
  if (articulation === null) return null;

  return {
    hinge: props.prepared.hinge,
    upper: {
      bone: chain.upper,
      ...decomposeJointRotation(
        articulation.upper,
        props.jointAxes?.[chain.upper],
        props.restFrames?.[chain.upper],
        props.prepared.upperDomain,
      ),
    },
    lower: {
      bone: chain.lower,
      ...decomposeJointRotation(
        articulation.lower,
        props.jointAxes?.[chain.lower],
        props.restFrames?.[chain.lower],
        props.prepared.lowerDomain,
      ),
    },
  };
};
