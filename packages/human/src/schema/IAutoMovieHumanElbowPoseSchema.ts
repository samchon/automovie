import type { IAutoMovieHumanElbowPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Elbow hinge angle in degrees from the straight neutral position. Positive
 * flexion bends the elbow and negative values are hyperextension.
 */
export type IAutoMovieHumanElbowPoseSchema = IAutoMovieHumanElbowPose & {
  /** Flexion 147.3, hyperextension 2.75. */
  flexion?: number & tags.Minimum<-2.75> & tags.Maximum<147.3>;
};
