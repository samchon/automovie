import type { IAutoMovieHumanElbowPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanElbowPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanElbowPoseSchema = IAutoMovieHumanElbowPose & {
  /** Flexion 147.3, hyperextension 2.75. */
  flexion?: number & tags.Minimum<-2.75> & tags.Maximum<147.3>;
};
