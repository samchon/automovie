import { IAutoMovieVector3 } from "@automovie/interface";

import { LOCOMOTE_GROUND_EPSILON } from "./constants/LOCOMOTE_GROUND_EPSILON";

/** Classify one requested root displacement under the ground-gait epsilon. */
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
