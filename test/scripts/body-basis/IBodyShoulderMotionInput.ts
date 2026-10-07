import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human/body/structures/IAutoMovieHumanBodyShoulderPose";

/** Complete TT goals and the same shaped skeleton's actual rest readings. */
export interface IBodyShoulderMotionInput {
  goals: readonly IAutoMovieHumanBodyShoulderPose[];
  rests: readonly IAutoMovieHumanBodyShoulderPose[];
}
