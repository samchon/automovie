import { tags } from "typia";

/** Thoracic spine, T1 to T12, degrees (convention split of the recalled thoracolumbar totals). */
export interface IAutoMovieHumanThoracicPose {
  /** Forward bend 30, backward bend 10. */
  flexion?: number & tags.Minimum<-10> & tags.Maximum<30>;

  /** Side bend, 15 each way; positive toward the person's left. */
  lateralFlexion?: number & tags.Minimum<-15> & tags.Maximum<15>;

  /** Axial rotation, 40 each way; positive turns the front toward the left. */
  rotation?: number & tags.Minimum<-40> & tags.Maximum<40>;
}
