import { tags } from "typia";

/**
 * Glenohumeral joint, degrees. The bounds are the clinical shoulder-complex ranges, which include the girdle's share; girdle fields add on top, so combined poses can exceed what a person reaches.
 */
export interface IAutoMovieHumanShoulderPose {
  /** Forward elevation 170.4 (measured), extension 60 (AAOS). */
  flexion?: number & tags.Minimum<-60> & tags.Maximum<170.4>;

  /** Sideways elevation 180, adduction across the body 40 (AAOS). */
  abduction?: number & tags.Minimum<-40> & tags.Maximum<180>;

  /** External rotation 90, internal rotation 70 (recalled, Greene and Heckman 1994). */
  rotation?: number & tags.Minimum<-70> & tags.Maximum<90>;
}
