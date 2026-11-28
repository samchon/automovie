import type { AutoMovieVector3Tuple, IAutoMovieRecoveryChartFit } from "..";

/**
 * Callable construction of area-weighted rows from an admitted piecewise-affine
 * source chart.
 */

export namespace IAutoMovieRecoveryChartAreaObservations {
  /**
   * Clip positively oriented UV triangles to the requested tensor or
   * rectangular leaf partition. Sample each clipped child with seven-point
   * quadrature along both Duffy coordinates and weight its rows by physical
   * area. An optional positive exchange length adds two physical-gradient rows
   * at each sample. Exceeding the row budget or invalid chart geometry raises
   * an error.
   */

  export type Operation = (input: {
    /** Original physical source vertices in the registered millimetre frame. */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /** Source-vertex triples in positive UV winding. */
    triangles: readonly (readonly [number, number, number])[];

    /** Global normalized UV coordinates in source-vertex order. */
    parameters: readonly (readonly number[])[];

    /** U knot edges of the tensor partition when explicit rectangles are absent. */
    u: readonly number[];

    /** V knot edges of the tensor partition when explicit rectangles are absent. */
    v: readonly number[];

    /**
     * Optional complete rectangular leaf cover in [uMin, uMax, vMin, vMax]
     * order.
     */
    rectangles?: readonly (readonly [number, number, number, number])[];

    /**
     * Maximum number of weighted area observation rows; exceeding it refuses
     * the operation.
     */
    maxObservations: number;

    /**
     * Positive millimetre exchange length for the optional tangent derivative
     * objective.
     */
    physicalGradientLengthMm?: number;
  }) => {
    /** Fitting observations indexed by their containing patch and local UV. */
    observations: IAutoMovieRecoveryChartFit.Input["observations"][number][];

    /** Total original physical source-triangle area, in square millimetres. */
    sourceAreaMm2: number;

    /**
     * Total physical area represented by integrated clipped observations, in
     * square millimetres.
     */
    integratedAreaMm2: number;

    /** Number of clipped source triangle children integrated. */
    children: number;

    /**
     * Largest absolute retained-area discrepancy divided by source area over
     * the individual positive source triangles.
     */
    maximumRelativeAreaDiscrepancy: number;
  };
}
