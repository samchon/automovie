import { tags } from "typia";

/** Euclidean three-dimensional distances between the Farkas landmarks, in millimetres, following the [FaceBase inter-landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/). */
export interface IAutoMovieHumanNose {
  /** Alare to alare. */
  width: number & tags.Minimum<10> & tags.Maximum<70>;

  /** Nasion to subnasale. */
  height: number & tags.Minimum<15> & tags.Maximum<90>;

  /** Subnasale to pronasale. */
  protrusion: number & tags.Minimum<4> & tags.Maximum<45>;
}
