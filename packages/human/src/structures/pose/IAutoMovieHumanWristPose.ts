import { tags } from "typia";

/** Wrist, degrees. */
export interface IAutoMovieHumanWristPose {
  /** Palmar flexion 80, extension 70 (AAOS). */
  flexion?: number & tags.Minimum<-70> & tags.Maximum<80>;

  /** Radial deviation 20, ulnar deviation 30 (recalled, Greene and Heckman 1994). */
  radialDeviation?: number & tags.Minimum<-30> & tags.Maximum<20>;
}
