import type { IAutoMovieHumanForearmPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanForearmPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanForearmPoseSchema = IAutoMovieHumanForearmPose & {
  /** Pronation (palm turned down) 79.45, supination 87.8. */
  pronation?: number & tags.Minimum<-87.8> & tags.Maximum<79.45>;
};
