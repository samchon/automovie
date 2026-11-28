/**
 * Independent source-space and published-space triangle degeneracy
 * measurements.
 */
export namespace IAutoMovieMeasureContourFace64 {
  /**
   * Twice the triangle area, measured independently in the source and output
   * frames. The metre computation converts each position before subtracting
   * edges. Rounding and representability can differ between the two measures.
   * Callers decide whether to retain or omit a triangle.
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
