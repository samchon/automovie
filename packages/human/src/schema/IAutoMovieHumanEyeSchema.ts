import type { IAutoMovieHumanEye } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanEye. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanEyeSchema = IAutoMovieHumanEye & {
  /** Euclidean three-dimensional distance from endocanthion to exocanthion. */
  palpebralFissureLength: number & tags.Minimum<10> & tags.Maximum<50>;

  /** Upper to lower lid margin at the pupil, eye open at rest. */
  palpebralFissureHeight: number & tags.Minimum<3> & tags.Maximum<20>;
};
