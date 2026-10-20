import { tags } from "typia";

/** One eye opening measured between the Farkas landmarks, in millimetres. Fissure length follows the [FaceBase inter-landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/). */
export interface IAutoMovieHumanEye {
  /** Euclidean three-dimensional distance from endocanthion to exocanthion. */
  palpebralFissureLength: number & tags.Minimum<10> & tags.Maximum<50>;

  /** Upper to lower lid margin at the pupil, eye open at rest. */
  palpebralFissureHeight: number & tags.Minimum<3> & tags.Maximum<20>;
}
