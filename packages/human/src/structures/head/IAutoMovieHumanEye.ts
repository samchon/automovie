import { tags } from "typia";

/** One eye opening measured between the Farkas landmarks, in millimetres. */
export interface IAutoMovieHumanEye {
  /** Endocanthion to exocanthion. */
  palpebralFissureLength: number & tags.Minimum<10> & tags.Maximum<50>;

  /** Upper to lower lid margin at the pupil, eye open at rest. */
  palpebralFissureHeight: number & tags.Minimum<3> & tags.Maximum<20>;
}
