import type { IAutoMovieHumanShoulderPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Glenohumeral flexion, abduction and rotation, in degrees from neutral. The
 * positive directions are forward elevation, sideways elevation and external
 * rotation.
 */
export type IAutoMovieHumanShoulderPoseSchema = IAutoMovieHumanShoulderPose & {
  /** Forward elevation 170.4 (measured), extension 60 (AAOS). */
  flexion?: number & tags.Minimum<-60> & tags.Maximum<170.4>;

  /** Sideways elevation 180, adduction across the body 40 (AAOS). */
  abduction?: number & tags.Minimum<-40> & tags.Maximum<180>;

  /** External rotation 90, internal rotation 70 (recalled, Greene and Heckman 1994). */
  rotation?: number & tags.Minimum<-70> & tags.Maximum<90>;
};
