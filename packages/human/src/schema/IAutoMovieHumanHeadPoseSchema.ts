import type {
  IAutoMovieHumanHeadPose,
  IAutoMovieHumanPair,
} from "@automovie/interface";

import type { IAutoMovieHumanEyePoseSchema } from "./IAutoMovieHumanEyePoseSchema";
import type { IAutoMovieHumanJawPoseSchema } from "./IAutoMovieHumanJawPoseSchema";

/** Typia admission/schema metadata for IAutoMovieHumanHeadPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanHeadPoseSchema = IAutoMovieHumanHeadPose & {
  /** Gaze of each eye. */
  eyes?: IAutoMovieHumanPair<IAutoMovieHumanEyePoseSchema>;

  /** Temporomandibular joints. */
  jaw?: IAutoMovieHumanJawPoseSchema;
};
