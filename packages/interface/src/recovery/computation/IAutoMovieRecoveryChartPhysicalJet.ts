/**
 * Form two physical tangent observations for one affine source triangle. For
 * physical edges K=Q R and UV edges U, T=U R^-1 maps orthonormal physical
 * tangent coordinates to global UV. A leaf basis contributes
 * lengthMm*(phi_s_T[0,a]/hu + phi_t_T[1,a]/hv), with target lengthMm*Q[:,a].
 * Thus the two rows measure the source-metric first derivative residual.
 * Targets are millimetres and receive no position-origin subtraction. The
 * original triangle may cross the leaf bounds. Its frame is reusable by every
 * clipped child and quadrature point. UV orientation must be positive. A second
 * physical edge unresolved at machine-relative angular precision,
 * nonrepresentable positive area or nonfinite arithmetic throws. The diagonal
 * scale ratio and edge reconstruction residual are diagnostics, not condition
 * numbers, rank certificates or continuous source-error bounds. Input arrays
 * are not mutated and no geometry or normal is published.
 */

export namespace IAutoMovieRecoveryChartPhysicalJet {
  /**
   * Form two physical tangent observations for one affine source triangle. For
   * physical edges K=Q R and UV edges U, T=U R^-1 maps orthonormal physical
   * tangent coordinates to global UV. A leaf basis contributes
   * lengthMm*(phi_s_T[0,a]/hu + phi_t_T[1,a]/hv), with target lengthMm*Q[:,a].
   * Thus the two rows measure the source-metric first derivative residual.
   * Targets are millimetres and receive no position-origin subtraction. The
   * original triangle may cross the leaf bounds. Its frame is reusable by every
   * clipped child and quadrature point. UV orientation must be positive. A
   * second physical edge unresolved at machine-relative angular precision,
   * nonrepresentable positive area or nonfinite arithmetic throws. The diagonal
   * scale ratio and edge reconstruction residual are diagnostics, not condition
   * numbers, rank certificates or continuous source-error bounds. Input arrays
   * are not mutated and no geometry or normal is published.
   */

  export type Operation = (input: {
    /** Three private PL observations in millimetres, in triangle order. */
    pointsMm: readonly [
      readonly [number, number, number],
      readonly [number, number, number],
      readonly [number, number, number],
    ];

    /** Their dimensionless global UV addresses, with positive signed area. */
    parameters: readonly [
      readonly [number, number],
      readonly [number, number],
      readonly [number, number],
    ];

    /** Positive affine leaf rectangle [u0,u1,v0,v1] in the same global UV. */
    bounds: readonly [number, number, number, number];

    /** Positive physical derivative weight length, in millimetres. */
    lengthMm: number;
  }) => {
    /**
     * Weights of local leaf phi_s and phi_t; targets multiply the same
     * millimetre coefficients.
     */
    directions: [
      {
        /**
         * Coefficient of the local u derivative in the declared physical
         * directional operator.
         */
        du: number;
        /**
         * Coefficient of the local v derivative in the declared physical
         * directional operator.
         */
        dv: number;
        /**
         * Observed target in the operation's millimetre exchange scale;
         * derivative rows retain their physical directional meaning.
         */
        targetMm: [number, number, number];
      },
      {
        /**
         * Coefficient of the local u derivative in the declared physical
         * directional operator.
         */
        du: number;
        /**
         * Coefficient of the local v derivative in the declared physical
         * directional operator.
         */
        dv: number;
        /**
         * Observed target in the operation's millimetre exchange scale;
         * derivative rows retain their physical directional meaning.
         */
        targetMm: [number, number, number];
      },
    ];

    /**
     * Original physical triangle area, before any private clipping, square
     * millimetres.
     */
    sourceAreaMm2: number;

    /** Twice the positive signed area of the original UV triangle. */
    determinantUv: number;

    /**
     * Smaller over larger positive QR diagonal magnitude, not a condition
     * number.
     */
    tangentScaleRatio: number;

    /** Largest Euclidean edge residual of reconstructed K=Q R, millimetres. */
    reconstructionErrorMm: number;
  };
}
