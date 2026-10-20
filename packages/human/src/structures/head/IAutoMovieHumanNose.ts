import { tags } from "typia";

/** Nose measurements between the Farkas landmarks, in millimetres. */
export interface IAutoMovieHumanNose {
  /** Alare to alare. */
  width: number & tags.Minimum<10> & tags.Maximum<70>;

  /** Nasion to subnasale. */
  height: number & tags.Minimum<15> & tags.Maximum<90>;

  /** Subnasale to pronasale. */
  protrusion: number & tags.Minimum<4> & tags.Maximum<45>;
}
