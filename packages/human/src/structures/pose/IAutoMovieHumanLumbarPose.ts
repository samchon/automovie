import { tags } from "typia";

/** Lumbar spine, L1 to S1, degrees (convention split of the recalled thoracolumbar totals). */
export interface IAutoMovieHumanLumbarPose {
  /** Forward bend 50, backward bend 15. */
  flexion?: number & tags.Minimum<-15> & tags.Maximum<50>;

  /** Side bend, 20 each way; positive toward the person's left. */
  lateralFlexion?: number & tags.Minimum<-20> & tags.Maximum<20>;

  /** Axial rotation, 5 each way; positive turns the front toward the left. */
  rotation?: number & tags.Minimum<-5> & tags.Maximum<5>;
}
