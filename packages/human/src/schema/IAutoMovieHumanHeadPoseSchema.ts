import type {
  IAutoMovieHumanHeadPose,
  IAutoMovieHumanPair,
} from "@automovie/interface";

import type { IAutoMovieHumanEyePoseSchema } from "./IAutoMovieHumanEyePoseSchema";
import type { IAutoMovieHumanJawPoseSchema } from "./IAutoMovieHumanJawPoseSchema";

/**
 * Optional gaze and jaw controls for typia validation. Supply left and right
 * eye records when specifying gaze. Angles are in degrees and jaw travel is in
 * millimetres.
 */
export type IAutoMovieHumanHeadPoseSchema = IAutoMovieHumanHeadPose & {
  /** Gaze of each eye. */
  eyes?: IAutoMovieHumanPair<IAutoMovieHumanEyePoseSchema>;

  /** Temporomandibular joints. */
  jaw?: IAutoMovieHumanJawPoseSchema;
};
