import type { IAutoMovieHumanAtlantoAxialPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Axial head rotation at the atlas, in degrees from neutral. Positive rotation
 * turns the face toward the person's left. The admitted interval is [-40, 40].
 */
export type IAutoMovieHumanAtlantoAxialPoseSchema =
  IAutoMovieHumanAtlantoAxialPose & {
    /** Head rotation, 40 each way; positive turns the face toward the person's left. */
    rotation?: number & tags.Minimum<-40> & tags.Maximum<40>;
  };
