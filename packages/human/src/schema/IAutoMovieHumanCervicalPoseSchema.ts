import type { IAutoMovieHumanCervicalPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanCervicalPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanCervicalPoseSchema = IAutoMovieHumanCervicalPose & {
  /** Forward bend 35, backward bend 30. */
  flexion?: number & tags.Minimum<-30> & tags.Maximum<35>;

  /** Side bend, 40 each way; positive toward the person's left. */
  lateralFlexion?: number & tags.Minimum<-40> & tags.Maximum<40>;

  /** Axial rotation, 20 each way; positive turns the face toward the left. */
  rotation?: number & tags.Minimum<-20> & tags.Maximum<20>;
};
