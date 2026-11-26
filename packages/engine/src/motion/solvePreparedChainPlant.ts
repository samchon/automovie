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

import { decomposeJointRotation } from "../kinematics/internal/decomposeJointRotation";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { twoBoneChainArticulation } from "../kinematics/twoBoneChainArticulation";
import type { prepareChainFit } from "./prepareChainFit";

/**
 * Solve one prepared two-bone chain for a model-metre target and bend normal.
 * Return null when analytic articulation is unavailable; otherwise decompose
 * upper and lower rotations through the same prepared clinical domains used by
 * residual FK. An optional rig context must belong to these exact unchanged
 * axes, rest frames, skeleton and source preparation; it shares basis
 * admission, not a solve. A supplied target must be the actual
 * twoBoneChainArticulation.prepare source's target reader for these exact
 * unchanged resolved frames and point; it shares completed geometric
 * preparation, never a candidate articulation.
 */
export function solvePreparedChainPlant(
  props: IAutoMovieSolvePreparedChainPlantProps,
  rig?: prepareChainFit.IRig,
  target?: twoBoneChainArticulation.IPreparedTarget,
): IAutoMovieSolvedChainPlant | null {
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
}

/**
 * Keep each clinical decomposition at its original post-geometry site without a
 * new closure per candidate.
 */
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
