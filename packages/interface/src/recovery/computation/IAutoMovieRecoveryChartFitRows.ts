/**
 * Stream one position row and its optional two physical-gradient rows. Signed
 * derivative Bernstein weights are linear observations of coefficients, not
 * additional point positions. Physical operators already contain the leaf
 * parameter scales and the declared millimetre exchange length. No derivative
 * target is restricted to the position enclosure. Row mass is measured in the
 * same arithmetic so a solver can translate position coordinates without
 * subtracting its origin from an unscaled derivative target.
 */

export namespace IAutoMovieRecoveryChartFitRows {
  /**
   * Stream one position row and its optional two physical-gradient rows. Signed
   * derivative Bernstein weights are linear observations of coefficients, not
   * additional point positions. Physical operators already contain the leaf
   * parameter scales and the declared millimetre exchange length. No derivative
   * target is restricted to the position enclosure. Row mass is measured in the
   * same arithmetic so a solver can translate position coordinates without
   * subtracting its origin from an unscaled derivative target.
   */

  export type Operation = (sample: {
    /** Normalized u coordinate in the declared local patch or unit source chart. */
    u: number;

    /** Normalized v coordinate in the declared local patch or unit source chart. */
    v: number;

    /**
     * Physical position in the registered millimetre frame; no coordinate
     * matching or source repair is implied.
     */
    pointMm: readonly [number, number, number];

    /**
     * Optional physical directional-derivative observation; absence contributes
     * only the position row.
     */
    physicalJet?: {
      /**
       * Declared physical projection or tangent directions in the owning
       * observation chart.
       */
      directions: readonly {
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
        targetMm: readonly [number, number, number];
      }[];
    };
  }) => Generator<
    {
      /**
       * Closed representation discriminator selecting the corresponding
       * observation or result arm.
       */
      kind: "position" | "physical-gradient";

      /**
       * Signed Bernstein row weights in original control order; derivative rows
       * are not position convex combinations.
       */
      coefficients: number[];

      /**
       * Observed target in the operation's millimetre exchange scale;
       * derivative rows retain their physical directional meaning.
       */
      targetMm: readonly [number, number, number];

      /**
       * Signed sum of the row coefficients, used when translating the position
       * normalization origin.
       */
      mass: number;
    },
    void,
    void
  >;
}
