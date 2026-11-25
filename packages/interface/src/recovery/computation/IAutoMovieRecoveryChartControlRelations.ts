/**
 * Eliminate acyclic affine control relations without changing their
 * coefficients. Original control IDs remain the independent term addresses;
 * they are never replaced by compact solver slots. Fixed positions and returned
 * constants are millimetres. Relations may have signed weights or sums other
 * than one. Equal terms combine, exact zero sums disappear, and fixed terms
 * fold into the constant. No epsilon deletion, weight normalization or
 * convexity repair occurs. maxTerms bounds each intermediate flattened
 * provenance map, including fixed sources, and every final independent
 * expression. maxDepth counts relation edges; fixed and independent controls
 * have depth zero. Cycles are rejected even when a declared dependency has zero
 * weight or later cancels. Weight diagnostics describe flattened fixed and
 * independent source weights before fixed-position folding. They do not certify
 * a dependent enclosure. Invalid identities, conflicts, budget exhaustion or
 * nonfinite arithmetic throw without mutating input or returning a partial
 * relation system.
 */

export namespace IAutoMovieRecoveryChartControlRelations {
  /**
   * Eliminate acyclic affine control relations without changing their
   * coefficients. Original control IDs remain the independent term addresses;
   * they are never replaced by compact solver slots. Fixed positions and
   * returned constants are millimetres. Relations may have signed weights or
   * sums other than one. Equal terms combine, exact zero sums disappear, and
   * fixed terms fold into the constant. No epsilon deletion, weight
   * normalization or convexity repair occurs. maxTerms bounds each intermediate
   * flattened provenance map, including fixed sources, and every final
   * independent expression. maxDepth counts relation edges; fixed and
   * independent controls have depth zero. Cycles are rejected even when a
   * declared dependency has zero weight or later cancels. Weight diagnostics
   * describe flattened fixed and independent source weights before
   * fixed-position folding. They do not certify a dependent enclosure. Invalid
   * identities, conflicts, budget exhaustion or nonfinite arithmetic throw
   * without mutating input or returning a partial relation system.
   */

  export type Operation = (input: {
    /** Nonnegative native-array control count, at most 2^32-1 original IDs. */
    controls: number;

    /** Each listed control has exactly this finite millimetre position. */
    fixed: readonly {
      /**
       * Zero-based ordinal in this record's owning cell, component or control
       * registry; it is not a source coordinate.
       */
      id: number;
      /**
       * Physical position in the registered millimetre frame; no coordinate
       * matching or source repair is implied.
       */
      pointMm: readonly [number, number, number];
    }[];

    /** Dependent controls and their finite weighted original-ID expressions. */
    relations: readonly {
      /**
       * Zero-based ordinal in this record's owning cell, component or control
       * registry; it is not a source coordinate.
       */
      id: number;

      /**
       * Sparse affine contributions in original control IDs; duplicate IDs and
       * signed weights retain the owning operation's declared combination
       * rule.
       */
      terms: readonly {
        /**
         * Zero-based ordinal in this record's owning cell, component or control
         * registry; it is not a source coordinate.
         */
        id: number;
        /**
         * Dimensionless signed affine coefficient; neither positivity nor
         * convexity is inferred.
         */
        weight: number;
      }[];
    }[];

    /** Positive safe cap on intermediate provenance and final independent terms. */
    maxTerms: number;

    /** Nonnegative safe cap on the relation-edge dependency depth. */
    maxDepth: number;
  }) => {
    /** Unowned original IDs, in ascending order; these are the free variables. */
    independent: number[];

    /** One sparse millimetre expression per original control, in input ID order. */
    expressions: {
      /**
       * Fixed affine control contribution in the same physical millimetre chart
       * as the dependent coefficient.
       */
      constant: [number, number, number];

      /**
       * Sparse affine contributions in original control IDs; duplicate IDs and
       * signed weights retain the owning operation's declared combination
       * rule.
       */
      terms: {
        /**
         * Zero-based ordinal in this record's owning cell, component or control
         * registry; it is not a source coordinate.
         */
        id: number;
        /**
         * Dimensionless signed affine coefficient; neither positivity nor
         * convexity is inferred.
         */
        weight: number;
      }[];
    }[];

    /** Largest final independent term count, excluding folded fixed sources. */
    maximumTerms: number;

    /** Largest declared relation-edge depth, including zero-weight dependencies. */
    maximumDepth: number;

    /** Least retained flattened source weight; zero for an empty expression. */
    minimumWeight: number;

    /** Largest absolute deviation of pre-folding source weight sum from one. */
    maximumWeightSumError: number;
  };
}
