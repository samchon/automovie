/**
 * Four horizontal support extents supplied to the lower-neck radius constraint
 * in calibration millimetres. Runtime construction and admission remain with
 * AutoMovieHumanHeadNeckBase in Human.
 */
export namespace IAutoMovieHumanHeadNeckBase {
  /**
   * Readonly front, left, back and right support magnitudes of the retained
   * horizontal neck template, in calibration millimetres. These dimensions
   * remain fixed while the lower-neck radius constraint selects its own source
   * parameter.
   */
  export type CreateExtents = readonly [number, number, number, number];
}
