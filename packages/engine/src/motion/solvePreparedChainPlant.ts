import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieJointRotationDomain } from "../kinematics/IAutoMovieJointRotationDomain";
import type { IAutoMovieResolvedJointAngles } from "../kinematics/IAutoMovieResolvedJointAngles";
import type { IAutoMovieTwoBoneArticulation } from "../kinematics/IAutoMovieTwoBoneArticulation";
import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { twoBoneChainArticulation } from "../kinematics/twoBoneChainArticulation";
import type { IAutoMovieSolvedChainPlant } from "./IAutoMovieSolvedChainPlant";
import type { IPreparedChainPlant } from "./IPreparedChainPlant";
import type { ISolvePreparedChainPlantProps } from "./ISolvePreparedChainPlantProps";
import type { prepareChainFit } from "./prepareChainFit";

/**
 * Solve one prepared two-bone chain for a model-metre target and bend normal. Return null when analytic articulation is unavailable; otherwise decompose upper and lower rotations through the same prepared clinical domains used by residual FK.
 * An optional rig context must belong to these exact unchanged axes, rest
 * frames, skeleton and source preparation; it shares basis admission, not a solve.
 *
 * @evidence contracts/development/implementation.md#principled-implementation twoBoneChainArticulation solves the supplied rest geometry, then decomposeJointRotation maps its two quaternions through the caller's axes/rest frames and prepared domains; the unchanged preparation supplies compatible constraints.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The helper evaluates one bend candidate, leaving candidate search, continuity and constrained residual selection to fitChainToTarget.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts It neither clamps a failing target into a reported success nor substitutes different rest geometry; null from the analytic solve is propagated.
 * @evidence contracts/development/common.md#meaningful-documentation Documents model metres, prepared-domain identity, returned hinge and null failure rather than a global IK-optimality claim.
 * @evidence contracts/development/implementation.md#efficient-algorithms One analytic solve and two bounded joint-domain decompositions are performed per candidate; preparation and full-skeleton residual FK are not rebuilt here.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Endpoints and domains are shared across candidates; an optional matching rig context also admits each clinical basis once at the original post-analytic-solve site. Null analytic admission never reads a basis.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned articulation records; preparation and input maps are borrowed and the helper retains no solver workspace or resource.
 */
export const solvePreparedChainPlant: (
  props: ISolvePreparedChainPlantProps,
  rig?: prepareChainFit.IRig,
) => IAutoMovieSolvedChainPlant | null = (
  props: ISolvePreparedChainPlantProps,
  rig?: prepareChainFit.IRig,
): IAutoMovieSolvedChainPlant | null => {
  const { chain, upper, lower }: IPreparedChainPlant = props.prepared;

  const articulation: IAutoMovieTwoBoneArticulation | null =
    twoBoneChainArticulation({
      upper,
      lower,
      end: props.prepared.end,
      target: props.target,
      bendNormal: props.bendNormal,
    });
  if (articulation === null) return null;

  /** Keep clinical admission after successful geometry, reusing only a matching immutable rig basis. */
  const angles: (
    bone: AutoMovieHumanoidBone,
    rotation: IAutoMovieQuaternion,
    domain: IAutoMovieJointRotationDomain,
  ) => IAutoMovieResolvedJointAngles = (
    bone: AutoMovieHumanoidBone,
    rotation: IAutoMovieQuaternion,
    domain: IAutoMovieJointRotationDomain,
  ): IAutoMovieResolvedJointAngles =>
    rig === undefined
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

  return {
    hinge: props.prepared.hinge,
    upper: {
      bone: chain.upper,
      ...angles(chain.upper, articulation.upper, props.prepared.upperDomain),
    },
    lower: {
      bone: chain.lower,
      ...angles(chain.lower, articulation.lower, props.prepared.lowerDomain),
    },
  };
};
