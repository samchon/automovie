/** Callable stream of a position row and optional physical tangent rows. */

export namespace IAutoMovieRecoveryChartFitRows {
  /**
   * Evaluate sixteen bicubic basis weights at the supplied local [u, v]. Yield
   * the position row and, when present, two signed derivative rows from the
   * physical tangent operators. Return the computed row mass so normalized
   * assembly can handle positions and derivatives consistently. Invalid
   * observations or unrepresentable derivative rows throw when requested.
   */

  export type Operation = (sample: {
    /** Local normalized U parameter of this observation. */
    u: number;

    /** Local normalized V parameter of this observation. */
    v: number;

    /** Observed physical position in registered millimetres. */
    pointMm: readonly [number, number, number];

    /**
     * Optional two-direction physical tangent observation from the source
     * triangle.
     */
    physicalJet?: {
      /** Two signed chart derivative operators with their millimetre targets. */
      directions: readonly {
        /** U derivative contribution in the scaled local tangent operator. */
        du: number;

        /** V derivative contribution in the scaled local tangent operator. */
        dv: number;

        /**
         * Observed directional derivative target in the declared millimetre
         * exchange scale.
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
