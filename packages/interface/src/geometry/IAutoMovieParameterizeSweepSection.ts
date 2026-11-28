import type { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";

/** Closed-curve parameter evaluation and natural span count. */
export namespace IAutoMovieParameterizeSweepSection {
  /**
   * Closed curve evaluator and the number of equal parameter spans per turn.
   *
   * Polygon knots evaluate to authored corners, cubic B?zier knots to anchors,
   * and a uniform cubic B-spline uses the four cyclic controls surrounding each
   * span. The evaluator is for superellipse, B-spline, B?zier and polygon
   * curves.
   */
  export type IResult = {
    /**
     * Evaluate a finite closed-curve parameter modulo one and return a new XY
     * point in section metres. Keep referenced curve data stable while
     * evaluating.
     */
    point: (t: number) => IAutoMovieSweepSection.IPoint;

    /**
     * Natural equal span count per turn used to choose walk density during
     * angular inversion.
     */
    segments: number;
  };
}
