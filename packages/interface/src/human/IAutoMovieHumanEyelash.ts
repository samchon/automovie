import type { AutoMovieHumanHairColor } from "./AutoMovieHumanHairColor";

/** Eyelashes along the lid margins. */
export interface IAutoMovieHumanEyelash {
  /** Lash colour. */
  color: AutoMovieHumanHairColor;

  /**
   * Length of the longest upper lash, millimetres; natural lashes rarely exceed
   * 12 mm (Aumond and Bitton 2018, J Optom 11(4):211-222). Schema constraints:
   * Minimum: 0; Maximum: 15; retained by Human's schema refinement.
   */
  length: number;
}
