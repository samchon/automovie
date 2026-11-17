import type { IAutoMovieHumanShoulderPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanShoulderPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanShoulderPoseSchema = IAutoMovieHumanShoulderPose & {
  /** Forward elevation 170.4 (measured), extension 60 (AAOS). */
  flexion?: number & tags.Minimum<-60> & tags.Maximum<170.4>;

  /** Sideways elevation 180, adduction across the body 40 (AAOS). */
  abduction?: number & tags.Minimum<-40> & tags.Maximum<180>;

  /** External rotation 90, internal rotation 70 (recalled, Greene and Heckman 1994). */
  rotation?: number & tags.Minimum<-70> & tags.Maximum<90>;
};
