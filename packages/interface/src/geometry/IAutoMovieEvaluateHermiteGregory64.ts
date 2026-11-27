import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** Position and analytic partials of a rational Hermite-Gregory chart. */
export namespace IAutoMovieEvaluateHermiteGregory64 {
  /**
   * Newly allocated position and analytic first partials at one unit-square
   * query. Four boundary functions carry position, along-edge tangent, cross
   * derivative and its along-edge derivative, in bottom/right/top/left order.
   * Cross derivatives always follow increasing chart u or v, independently of
   * boundary walk. Corner positions and first derivatives must be compatible;
   * mixed derivatives may differ. Distance-weighted Gregory twists reconcile
   * those mixed corner values. The result is rational, with removable corner
   * limits, and is not a bicubic. The evaluator checks four edges and finite
   * u,v in [0,1]. Boundary-jet compatibility and finite output arithmetic
   * remain caller premises; callback exceptions propagate and callbacks are not
   * retained after the query.
   */
  export type IResult = {
    /**
     * Evaluated Cartesian position in the common boundary-jet frame and length
     * unit.
     */
    point: AutoMovieVector3Tuple;

    /**
     * Analytic dP/du for increasing normalized u; length per unit u, not a unit
     * tangent.
     */
    du: AutoMovieVector3Tuple;

    /**
     * Analytic dP/dv for increasing normalized v; length per unit v, not a unit
     * tangent.
     */
    dv: AutoMovieVector3Tuple;
  };
}
