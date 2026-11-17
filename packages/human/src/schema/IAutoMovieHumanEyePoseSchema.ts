import type { IAutoMovieHumanEyePose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanEyePose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanEyePoseSchema = IAutoMovieHumanEyePose & {
  /** Vertical gaze: positive up, negative down, 30 each way. */
  vertical?: number & tags.Minimum<-30> & tags.Maximum<30>;

  /** Horizontal gaze: positive toward the person's left, negative toward the right, 45 each way. */
  horizontal?: number & tags.Minimum<-45> & tags.Maximum<45>;
};
