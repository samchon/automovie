import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * A point the web's skin leaves behind, and how far past it a digit's first
 * section must stand: the digit's first section is the first station whose
 * plane has every such point behind it by its margin, so every column of the
 * web descends from the parent's ring to the digit.
 */
export interface IAutoMovieHumanHandClear {
  /**
   * The point, in the hand form's axes (millimetres of the form) until mapped,
   * then world mm.
   */
  point: AutoMovieVector3Tuple;

  /**
   * Distance past it along the digit the section's plane must stand, mm of the
   * form (mapped by the hand's largest scale).
   */
  margin: number;
}
