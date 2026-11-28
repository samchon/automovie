import type { IAutoMovieHumanAtlantoOccipitalPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Skull-to-atlas nod and tilt in degrees from neutral. Positive flexion brings
 * the chin inward. Positive lateral flexion tilts toward the person's left.
 */
export type IAutoMovieHumanAtlantoOccipitalPoseSchema =
  IAutoMovieHumanAtlantoOccipitalPose & {
    /** Nod: chin-in flexion 10, chin-up extension 15. */
    flexion?: number & tags.Minimum<-15> & tags.Maximum<10>;

    /** Head tilt, 5 each way; positive toward the person's left. */
    lateralFlexion?: number & tags.Minimum<-5> & tags.Maximum<5>;
  };
