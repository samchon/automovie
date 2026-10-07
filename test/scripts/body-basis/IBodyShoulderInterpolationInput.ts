import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human/body/structures/IAutoMovieHumanBodyShoulderPose";

/** Same-humerus TT endpoints and their dimensionless path fraction. */
export interface IBodyShoulderInterpolationInput {
  from: IAutoMovieHumanBodyShoulderPose;
  to: IAutoMovieHumanBodyShoulderPose;
  fraction: number;
}
