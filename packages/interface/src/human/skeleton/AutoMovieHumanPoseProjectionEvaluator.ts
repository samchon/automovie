import type { IAutoMovieHumanParameters } from "../IAutoMovieHumanParameters";
import type { IAutoMovieHumanPoseProjection } from "./IAutoMovieHumanPoseProjection";

/**
 * A fixed bone selection, with fresh results under every current input pose.
 * Omitted pose means an empty clinical pose (neutral); omitted clamp is true.
 */
export type AutoMovieHumanPoseProjectionEvaluator = (
  pose?: NonNullable<IAutoMovieHumanParameters["pose"]>,
  clamp?: boolean,
) => IAutoMovieHumanPoseProjection;
