/** The physical diameter result of measuring a cubic oval perimeter. */
export namespace IAutoMovieCubicOval64 {
  /**
   * Breadth and depth in millimetres for a cubic oval with supplied finite
   * positive girth and aspect ratio.
   *
   * Supply positive finite girth and ratio with representable positive
   * diameters. A computed diameter at or below zero or NaN is refused.
   */
  export type IAxesBySimpsonResult = {
    /**
     * Lateral support separation in millimetres for the normalized-and-scaled
     * cubic oval.
     */
    breadthMm: number;

    /**
     * Anterior-to-posterior support separation in millimetres for the same
     * cubic oval.
     */
    depthMm: number;
  };
}
