import type { IAutoMovieHumanFingerPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanFingerPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
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
