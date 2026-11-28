import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** Cubic Bernstein coefficients and physical-chart endpoint conversion results. */
export namespace IAutoMovieCurveMath64 {
  /**
   * Mutable ordered four-control XYZ Bernstein span in one caller-defined chart
   * and value unit.
   */
  export type Span = [
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
  ];

  /**
   * Owned cubic endpoints and endpoint derivatives per supplied positive finite
   * chart width.
   *
   * Supply dense finite controls and positive finite chart width. Binary64
   * representability and endpoint rounding limit reversibility.
   */
  export type IToHermiteResult = {
    /**
     * Fresh first Bernstein endpoint triple in the input chart and coefficient
     * units.
     */
    start: AutoMovieVector3Tuple;

    /**
     * Fresh last Bernstein endpoint triple in the same chart and coefficient
     * units.
     */
    end: AutoMovieVector3Tuple;

    /**
     * Fresh derivative per chart unit at the first endpoint, algebraically 3 ?
     * (P1 ? P0) divided by chart width.
     */
    startDerivative: AutoMovieVector3Tuple;

    /**
     * Fresh derivative per chart unit at the last endpoint, algebraically 3 ?
     * (P3 ? P2) divided by chart width.
     */
    endDerivative: AutoMovieVector3Tuple;
  };
}
