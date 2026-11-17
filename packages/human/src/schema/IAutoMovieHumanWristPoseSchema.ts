import type { IAutoMovieHumanWristPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanWristPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanWristPoseSchema = IAutoMovieHumanWristPose & {
  /** Palmar flexion 80, extension 70 (AAOS). */
  flexion?: number & tags.Minimum<-70> & tags.Maximum<80>;

  /** Radial deviation 20, ulnar deviation 30 (recalled, Greene and Heckman 1994). */
  radialDeviation?: number & tags.Minimum<-30> & tags.Maximum<20>;
};
