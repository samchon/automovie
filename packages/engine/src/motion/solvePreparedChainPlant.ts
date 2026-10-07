import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { twoBoneChainArticulation } from "../kinematics/twoBoneChainArticulation";
import type { ISolvePreparedChainPlantProps } from "./ISolvePreparedChainPlantProps";
import type { IAutoMovieSolvedChainPlant } from "./IAutoMovieSolvedChainPlant";

/**
 * Solve one bend normal against prepared chain geometry and unchanged joint domains.
 * The solver and residual reader share these same rest transforms and constraints;
 * offsets and endpoints use the resolved model metre frame.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Carries the actual two-link rest geometry used to bound and reconstruct a contact solve.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Retains the compiled chain frames and effective joint domains shared by inverse solving and final effector readback.
 * @author Samchon
 */

export const solvePreparedChainPlant = (props: ISolvePreparedChainPlantProps): IAutoMovieSolvedChainPlant | null => {
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
