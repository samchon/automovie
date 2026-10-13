import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { twoBoneChainArticulation } from "../kinematics/twoBoneChainArticulation";
import type { IAutoMovieSolvedChainPlant } from "./IAutoMovieSolvedChainPlant";
import type { ISolvePreparedChainPlantProps } from "./ISolvePreparedChainPlantProps";

/**
 * Solve one bend normal against prepared chain geometry and unchanged joint domains.
 * The solver and residual reader share these same rest transforms and constraints;
 * offsets and endpoints use the resolved model metre frame.
 *
 * @author Samchon
 */

export const solvePreparedChainPlant = (
  props: ISolvePreparedChainPlantProps,
): IAutoMovieSolvedChainPlant | null => {
  const { chain, upper, lower } = props.prepared;

  const articulation = twoBoneChainArticulation({
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
