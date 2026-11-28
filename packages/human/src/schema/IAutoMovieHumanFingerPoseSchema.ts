import type { IAutoMovieHumanFingerPose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Angles for one of the four non-thumb fingers, in degrees from neutral. The
 * base joint flexes and abducts. The middle and distal joints flex.
 */
export type IAutoMovieHumanFingerPoseSchema = IAutoMovieHumanFingerPose & {
  /** Metacarpophalangeal flexion, 0 to 80. */
  mcpFlexion?: number & tags.Minimum<0> & tags.Maximum<80>;

  /** Metacarpophalangeal abduction away from the middle finger (the middle finger: toward the thumb), 20 each way (convention). */
  mcpAbduction?: number & tags.Minimum<-20> & tags.Maximum<20>;

  /** Proximal interphalangeal flexion, 0 to 90. */
  pipFlexion?: number & tags.Minimum<0> & tags.Maximum<90>;

  /** Distal interphalangeal flexion, 0 to 65. */
  dipFlexion?: number & tags.Minimum<0> & tags.Maximum<65>;
};
