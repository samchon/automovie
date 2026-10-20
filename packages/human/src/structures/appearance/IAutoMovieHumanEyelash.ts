import { tags } from "typia";

import { AutoMovieHumanHairColor } from "../../typings/AutoMovieHumanHairColor";

/**
 * Eyelashes along the lid margins.
 */
export interface IAutoMovieHumanEyelash {
  /** Lash colour. */
  color: AutoMovieHumanHairColor;

  /**
   * Length of the longest upper lash, millimetres; natural lashes rarely exceed 12 mm (Aumond and Bitton 2018, J Optom 11(4):211-222).
   */
  length: number & tags.Minimum<0> & tags.Maximum<15>;
}
