import type { IAutoMovieHumanWristPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Palmar flexion and radial deviation in degrees from neutral. Positive values
 * bend toward the palm and toward the thumb. Negative values describe
 * extension and ulnar deviation.
 */
export type IAutoMovieHumanWristPoseSchema = IAutoMovieHumanWristPose & {
  /** Palmar flexion 80, extension 70 (AAOS). */
  flexion?: number & tags.Minimum<-70> & tags.Maximum<80>;

  /** Radial deviation 20, ulnar deviation 30 (recalled, Greene and Heckman 1994). */
  radialDeviation?: number & tags.Minimum<-30> & tags.Maximum<20>;
};
