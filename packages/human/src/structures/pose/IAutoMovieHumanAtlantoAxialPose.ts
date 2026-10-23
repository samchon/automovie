import { tags } from "typia";

/** Atlanto-axial joint, C1 on C2, degrees (recalled, White and Panjabi 1990). */
export interface IAutoMovieHumanAtlantoAxialPose {
  /** Head rotation, 40 each way; positive turns the face toward the person's left. */
  rotation?: number & tags.Minimum<-40> & tags.Maximum<40>;
}
