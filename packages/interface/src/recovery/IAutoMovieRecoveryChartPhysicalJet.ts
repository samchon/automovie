/**
 * Callable construction of two first-derivative observations from an affine
 * source triangle.
 */

export namespace IAutoMovieRecoveryChartPhysicalJet {
  /**
   * Factor the two physical edge vectors with thin QR. Map the orthonormal
   * tangent directions to global UV, then scale them into the containing leaf
   * and multiply by the requested millimetre exchange length. Reject a
   * collapsed or numerically unresolved tangent frame.
   */

  export type Operation = (input: {
    /** Three original physical triangle vertices in registered millimetres. */
    pointsMm: readonly [
      readonly [number, number, number],
      readonly [number, number, number],
      readonly [number, number, number],
    ];

    /** Three original global UV coordinates in vertex order. */
    parameters: readonly [
      readonly [number, number],
      readonly [number, number],
      readonly [number, number],
    ];

    /** Containing leaf bounds [uMin, uMax, vMin, vMax]. */
    bounds: readonly [number, number, number, number];

    /**
     * Positive millimetre exchange length multiplying both tangent operators
     * and targets.
     */
    lengthMm: number;
  }) => {
    /** Two independent chart derivative operators and their physical targets. */
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

    /** Physical source triangle area in square millimetres. */
    sourceAreaMm2: number;

    /** Positive determinant of the source triangle's UV edge matrix. */
    determinantUv: number;

    /** Ratio of measured thin-QR tangent scales. */
    tangentScaleRatio: number;

    /** Maximum measured physical edge reconstruction discrepancy in millimetres. */
    reconstructionErrorMm: number;
  };
}
