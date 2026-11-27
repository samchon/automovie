import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanThumbBones; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanThumbBones {
  /**
   * The map argument of AutoMovieHumanThumbBones.of. Build the thumb's bones
   * and skin law.
   *
   * @param d The thumb's law in the hand form's axes.
   * @param joints The hand's joints, left frame, mm.
   * @param hand The hand's solved scales, with the thumb length.
   * @param map The hand's map from the form's axes to the left frame.
   */
  export type OfMap = (
    q: readonly [number, number, number],
  ) => AutoMovieVector3Tuple;
}
