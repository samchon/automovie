import type { IAutoMovieHumanLumbarPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Lumbar flexion, side bend and axial rotation in degrees from anatomical
 * neutral. Positive flexion bends forward. Positive side bend and rotation
 * move toward the person's left.
 */
export type IAutoMovieHumanLumbarPoseSchema = IAutoMovieHumanLumbarPose & {
  /** Forward bend 50, backward bend 15. */
  flexion?: number & tags.Minimum<-15> & tags.Maximum<50>;

  /** Side bend, 20 each way; positive toward the person's left. */
  lateralFlexion?: number & tags.Minimum<-20> & tags.Maximum<20>;

  /** Axial rotation, 5 each way; positive turns the front toward the left. */
  rotation?: number & tags.Minimum<-5> & tags.Maximum<5>;
};
