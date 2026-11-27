import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartFit,
} from "..";

/**
 * Integrate private piecewise-affine source observations inside axis-aligned
 * leaves. Positive UV triangles are clipped at the tensor knots before a
 * seven-by-seven Gauss rule on a Duffy triangle supplies physical-area weighted
 * correspondences. An optional rectangular leaf partition replaces the tensor
 * product; its open interiors must cover the unit square once. Every local map
 * remains affine. For a bicubic field minus an affine source this integrates
 * its squared residual exactly in real arithmetic. Binary64 arithmetic and
 * continuous maximum error remain separate qualifications. No private source
 * triangle leaves this operation. Optional physical-gradient frames are
 * computed once per source-triangle/leaf intersection by thin QR. The same
 * samples then stream two derivative rows; their squared polynomial degree is
 * at most ten, within the same Gauss rule.
 */

export namespace IAutoMovieRecoveryChartAreaObservations {
  /**
   * Integrate private piecewise-affine source observations inside axis-aligned
   * leaves. Positive UV triangles are clipped at the tensor knots before a
   * seven-by-seven Gauss rule on a Duffy triangle supplies physical-area
   * weighted correspondences. An optional rectangular leaf partition replaces
   * the tensor product; its open interiors must cover the unit square once.
   * Every local map remains affine. For a bicubic field minus an affine source
   * this integrates its squared residual exactly in real arithmetic. Binary64
   * arithmetic and continuous maximum error remain separate qualifications. No
   * private source triangle leaves this operation. Optional physical-gradient
   * frames are computed once per source-triangle/leaf intersection by thin QR.
   * The same samples then stream two derivative rows; their squared polynomial
   * degree is at most ten, within the same Gauss rule.
   */

  export type Operation = (input: {
    /**
     * Borrowed physical positions in the registered millimetre frame; indices
     * in triangles address this array.
     */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /**
     * Oriented triangle vertex-index triples addressing the paired position
     * array; indices are not control IDs.
     */
    triangles: readonly (readonly [number, number, number])[];

    /**
     * Normalized [u,v] coordinates aligned with the supplied source observation
     * vertices.
     */
    parameters: readonly (readonly number[])[];

    /**
     * Increasing normalized u-axis partition coordinates spanning the declared
     * chart domain.
     */
    u: readonly number[];

    /**
     * Increasing normalized v-axis partition coordinates spanning the declared
     * chart domain.
     */
    v: readonly number[];

    /**
     * Normalized source-chart rectangles [u0,v0,u1,v1] whose intersections are
     * integrated separately.
     */
    rectangles?: readonly (readonly [number, number, number, number])[];

    /**
     * Hard positive ceiling on the generated quadrature rows, including all
     * clipped children.
     */
    maxObservations: number;

    /**
     * Optional nonnegative millimetre exchange length multiplying physical
     * derivatives; zero or omission disables that objective term.
     */
    physicalGradientLengthMm?: number;
  }) => {
    /**
     * Weighted source-position and optional physical-gradient correspondences
     * used by the coefficient fit.
     */
    observations: IAutoMovieRecoveryChartFit.Input["observations"][number][];

    /** Area of the supplied physical source triangles, in square millimetres. */
    sourceAreaMm2: number;

    /**
     * Area represented by accepted quadrature, in square millimetres; null
     * means unavailable.
     */
    integratedAreaMm2: number;

    /**
     * Number of triangle/rectangle intersection children integrated by the
     * quadrature pass.
     */
    children: number;

    /**
     * Largest dimensionless relative mismatch between source and integrated
     * child area; null means unavailable.
     */
    maximumRelativeAreaDiscrepancy: number;
  };
}
