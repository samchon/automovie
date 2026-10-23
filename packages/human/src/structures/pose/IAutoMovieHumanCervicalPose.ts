import { tags } from "typia";

/** Lower cervical spine, C2 to C7, degrees: the AAOS cervical totals less the two cranio-vertebral joints. */
export interface IAutoMovieHumanCervicalPose {
  /** Forward bend 35, backward bend 30. */
  flexion?: number & tags.Minimum<-30> & tags.Maximum<35>;

  /** Side bend, 40 each way; positive toward the person's left. */
  lateralFlexion?: number & tags.Minimum<-40> & tags.Maximum<40>;

  /** Axial rotation, 20 each way; positive turns the face toward the left. */
  rotation?: number & tags.Minimum<-20> & tags.Maximum<20>;
}
