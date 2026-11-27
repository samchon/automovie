/**
 * Independent source-space and published-space triangle degeneracy
 * measurements.
 */
export namespace IAutoMovieMeasureContourFace64 {
  /**
   * Cross-product magnitudes used by contour emission to require finite
   * positive area before and after conversion to metres. Each value is twice
   * triangle area. The metre computation converts positions before subtraction,
   * so it is not obtained by scaling the millimetre result and may expose
   * different rounding.
   */
  export type IResult = {
    /**
     * Length of (q-p) cross (r-p) in mm squared for supplied millimetre
     * vertices; zero, Infinity or NaN remain observable.
     */
    millimetresSquared: number;

    /**
     * Double area in metres squared after independently multiplying each
     * position by 0.001 before forming edges and their cross product.
     */
    metresSquared: number;
  };
}
