import type { IAutoMovieHumanAtlantoAxialPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanAtlantoAxialPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanAtlantoAxialPoseSchema =
  IAutoMovieHumanAtlantoAxialPose & {
    /** Head rotation, 40 each way; positive turns the face toward the person's left. */
    rotation?: number & tags.Minimum<-40> & tags.Maximum<40>;
  };
