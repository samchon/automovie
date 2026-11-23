/**
 * Four signed-guide magnitudes in front/left/back/right order, calibration
 * millimetres. Runtime construction and admission remain with
 * AutoMovieHumanHeadSectionConstraints in Human.
 */
export namespace IAutoMovieHumanHeadSectionConstraints {
  /** Four signed-guide magnitudes, front/left/back/right, calibration mm. */
  export type Extents = [number, number, number, number];
}
