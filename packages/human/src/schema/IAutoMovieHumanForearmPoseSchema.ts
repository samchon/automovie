import type { IAutoMovieHumanForearmPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Forearm rotation in degrees from the thumb-forward neutral position.
 * Positive values turn the palm down in pronation. Negative values turn toward
 * supination.
 */
export type IAutoMovieHumanForearmPoseSchema = IAutoMovieHumanForearmPose & {
  /** Pronation (palm turned down) 79.45, supination 87.8. */
  pronation?: number & tags.Minimum<-87.8> & tags.Maximum<79.45>;
};
