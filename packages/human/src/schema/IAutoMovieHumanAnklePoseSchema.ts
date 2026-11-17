import type { IAutoMovieHumanAnklePose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanAnklePose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanAnklePoseSchema = IAutoMovieHumanAnklePose & {
  /** Dorsiflexion (toes up) 13.25, plantar flexion 58.35. */
  dorsiflexion?: number & tags.Minimum<-58.35> & tags.Maximum<13.25>;
};
