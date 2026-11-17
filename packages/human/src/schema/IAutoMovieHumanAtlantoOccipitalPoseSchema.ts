import type { IAutoMovieHumanAtlantoOccipitalPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanAtlantoOccipitalPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanAtlantoOccipitalPoseSchema =
  IAutoMovieHumanAtlantoOccipitalPose & {
    /** Nod: chin-in flexion 10, chin-up extension 15. */
    flexion?: number & tags.Minimum<-15> & tags.Maximum<10>;

    /** Head tilt, 5 each way; positive toward the person's left. */
    lateralFlexion?: number & tags.Minimum<-5> & tags.Maximum<5>;
  };
