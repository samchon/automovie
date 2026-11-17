import type { IAutoMovieHumanThoracicPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanThoracicPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanThoracicPoseSchema = IAutoMovieHumanThoracicPose & {
  /** Forward bend 30, backward bend 10. */
  flexion?: number & tags.Minimum<-10> & tags.Maximum<30>;

  /** Side bend, 15 each way; positive toward the person's left. */
  lateralFlexion?: number & tags.Minimum<-15> & tags.Maximum<15>;

  /** Axial rotation, 40 each way; positive turns the front toward the left. */
  rotation?: number & tags.Minimum<-40> & tags.Maximum<40>;
};
