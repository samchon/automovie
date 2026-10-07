import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human/body/structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieJointPose } from "@automovie/interface";

/** Optional shape and pose inputs retained by a source census receipt. */
export interface IBodyCensusDocument {
  shape?: Record<string, number>;
  pose?: IAutoMovieJointPose[];
  shoulders?: IAutoMovieHumanBodyShoulderPose[];
}
