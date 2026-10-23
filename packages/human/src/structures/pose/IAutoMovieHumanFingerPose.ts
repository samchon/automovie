import { tags } from "typia";

/** One finger's joints proximal to distal, degrees. Flexion carries the tip toward the palm; AAOS flexion norms with extension 0 (Richard and Parry). */
export interface IAutoMovieHumanFingerPose {
  /** Metacarpophalangeal flexion, 0 to 80. */
  mcpFlexion?: number & tags.Minimum<0> & tags.Maximum<80>;

  /** Metacarpophalangeal abduction away from the middle finger (the middle finger: toward the thumb), 20 each way (convention). */
  mcpAbduction?: number & tags.Minimum<-20> & tags.Maximum<20>;

  /** Proximal interphalangeal flexion, 0 to 90. */
  pipFlexion?: number & tags.Minimum<0> & tags.Maximum<90>;

  /** Distal interphalangeal flexion, 0 to 65. */
  dipFlexion?: number & tags.Minimum<0> & tags.Maximum<65>;
}
