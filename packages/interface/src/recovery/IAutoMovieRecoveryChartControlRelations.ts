/**
 * Callable reduction of a coefficient registry with fixed and affine-dependent
 * controls.
 */

export namespace IAutoMovieRecoveryChartControlRelations {
  /**
   * Expand acyclic signed identities into fixed millimetre constants and
   * independent-control weights in the original registry order. Supply finite
   * fixed positions and signed weights, a positive safe term cap and a
   * nonnegative safe depth cap. Invalid addresses, cycles, conflicting
   * definitions and nonrepresentable composition raise an error.
   */

  export type Operation = (input: {
    /** Total slots in the original control registry. */
    controls: number;

    /** Fixed original control IDs and registered positions. */
    fixed: readonly {
      /** Original slot occupied by this fixed control. */
      id: number;
      /** Fixed [X, Y, Z] position in registered millimetres. */
      pointMm: readonly [number, number, number];
    }[];

    /** Dependent original control IDs and their signed identity terms. */
    relations: readonly {
      /** Original control slot defined by this affine expression. */
      id: number;

      /** Signed contributions from original controls, expanded recursively. */
      terms: readonly {
        /** Original control id supplying this contribution. */
        id: number;
        /** Finite signed coefficient multiplying that original control. */
        weight: number;
      }[];
    }[];

    /** Maximum retained sparse terms during coefficient expansion. */
    maxTerms: number;

    /** Maximum acyclic dependency depth; zero permits no dependent relations. */
    maxDepth: number;
  }) => {
    /**
     * Original IDs left free after eliminating fixed and dependent controls, in
     * registry order.
     */
    independent: number[];

    /** One reduced affine expression per original control id. */
    expressions: {
      /** Physical millimetre constant after folding fixed sources. */
      constant: [number, number, number];

      /** Signed terms in independent original control IDs. */
      terms: {
        /** Independent original control id of this reduced term. */
        id: number;
        /** Combined signed coefficient of that independent control. */
        weight: number;
      }[];
    }[];

    /** Largest final independent-term population of one expression. */
    maximumTerms: number;

    /** Deepest dependency chain observed during expansion. */
    maximumDepth: number;

    /** Smallest signed original-source weight retained after flattening. */
    minimumWeight: number;

    /**
     * Largest absolute deviation of a flattened expression's weight sum from
     * one.
     */
    maximumWeightSumError: number;
  };
}
