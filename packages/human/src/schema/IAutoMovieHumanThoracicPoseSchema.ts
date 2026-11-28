import type { IAutoMovieHumanThoracicPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Thoracic flexion, side bend and axial rotation in degrees from anatomical
 * neutral. Positive flexion bends forward. Positive side bend and rotation
 * move toward the person's left.
 */
export type IAutoMovieHumanThoracicPoseSchema = IAutoMovieHumanThoracicPose & {
  /** Forward bend 30, backward bend 10. */
  flexion?: number & tags.Minimum<-10> & tags.Maximum<30>;

  /** Side bend, 15 each way; positive toward the person's left. */
  lateralFlexion?: number & tags.Minimum<-15> & tags.Maximum<15>;

  /** Axial rotation, 40 each way; positive turns the front toward the left. */
  rotation?: number & tags.Minimum<-40> & tags.Maximum<40>;
};
