import type { IAutoMovieHumanHalluxPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanHalluxPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanHalluxPoseSchema = IAutoMovieHumanHalluxPose & {
  /** Metatarsophalangeal flexion 45, extension 70 (AAOS). */
  mtpFlexion?: number & tags.Minimum<-70> & tags.Maximum<45>;

  /** Metatarsophalangeal abduction away from the second toe, 15 each way (convention). */
  mtpAbduction?: number & tags.Minimum<-15> & tags.Maximum<15>;

  /** Interphalangeal flexion, 0 to 90 (recalled, Greene and Heckman 1994). */
  ipFlexion?: number & tags.Minimum<0> & tags.Maximum<90>;
};
