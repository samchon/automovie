import type { IAutoMovieHumanEye } from "@automovie/interface";
import type { tags } from "typia";

/**
 * One eye opening at rest for typia validation. Supply the straight
 * three-dimensional distance between the inner and outer eye corners and the
 * lid separation at the pupil, both in millimetres.
 */
export type IAutoMovieHumanEyeSchema = IAutoMovieHumanEye & {
  /** Euclidean three-dimensional distance from endocanthion to exocanthion. */
  palpebralFissureLength: number & tags.Minimum<10> & tags.Maximum<50>;

  /** Upper to lower lid margin at the pupil, eye open at rest. */
  palpebralFissureHeight: number & tags.Minimum<3> & tags.Maximum<20>;
};
