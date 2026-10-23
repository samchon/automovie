import { tags } from "typia";

/** Atlanto-occipital joint, skull on C1, degrees (recalled, White and Panjabi 1990). */
export interface IAutoMovieHumanAtlantoOccipitalPose {
  /** Nod: chin-in flexion 10, chin-up extension 15. */
  flexion?: number & tags.Minimum<-15> & tags.Maximum<10>;

  /** Head tilt, 5 each way; positive toward the person's left. */
  lateralFlexion?: number & tags.Minimum<-5> & tags.Maximum<5>;
}
