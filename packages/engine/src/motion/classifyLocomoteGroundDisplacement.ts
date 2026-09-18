import { IAutoMovieVector3 } from "@automovie/interface";
import { LOCOMOTE_GROUND_EPSILON } from "./LOCOMOTE_GROUND_EPSILON";

/**
 * Classify one requested root displacement under the ground-gait epsilon.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Separates horizontal support travel, vertical-only motion, and an epsilon-sized no-op.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Gives locomotion callers an explicit ground-relative movement classification.
 */
export const classifyLocomoteGroundDisplacement = (
  displacement: IAutoMovieVector3,
): {
  groundDistance: number;
  travelDistance: number;
  alreadyThere: boolean;
  verticalOnly: boolean;
} => {
  const groundDistance = Math.hypot(displacement.x, displacement.z);
  const travelDistance = Math.hypot(
    displacement.x,
    displacement.y,
    displacement.z,
  );
  const alreadyThere = travelDistance < LOCOMOTE_GROUND_EPSILON;
  return {
    groundDistance,
    travelDistance,
    alreadyThere,
    verticalOnly:
      alreadyThere === false && groundDistance < LOCOMOTE_GROUND_EPSILON,
  };
};

const assertFiniteVector = (label: string, vector: IAutoMovieVector3): void => {
  if (!Number.isFinite(vector.x)) throw new Error(`${label}.x must be finite`);
  if (!Number.isFinite(vector.y)) throw new Error(`${label}.y must be finite`);
  if (!Number.isFinite(vector.z)) throw new Error(`${label}.z must be finite`);
};
