import type { IAutoMovieHumanHandPose } from "@automovie/interface";

import type { IAutoMovieHumanFingerPoseSchema } from "./IAutoMovieHumanFingerPoseSchema";
import type { IAutoMovieHumanThumbPoseSchema } from "./IAutoMovieHumanThumbPoseSchema";

/** Typia admission/schema metadata for IAutoMovieHumanHandPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanHandPoseSchema = IAutoMovieHumanHandPose & {
  /** Thumb. */
  thumb?: IAutoMovieHumanThumbPoseSchema;

  /** Index finger. */
  index?: IAutoMovieHumanFingerPoseSchema;

  /** Middle finger. */
  middle?: IAutoMovieHumanFingerPoseSchema;

  /** Ring finger. */
  ring?: IAutoMovieHumanFingerPoseSchema;

  /** Little finger. */
  little?: IAutoMovieHumanFingerPoseSchema;
};
