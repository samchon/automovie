/**
 * Close a private rectangle split under laminar opposed interface intervals.
 * Bounds are global unit-square [u0,u1,v0,v1] coordinates; axes 0 and 1 vary u
 * and v. An exact endpoint sweep first establishes one covering layer over
 * every positive-area cell. Every subsequent strict split preserves that
 * partition without moving an endpoint. Proper overlaps propagate an existing
 * smaller end into the opposite leaf; identical, contained and disjoint
 * interfaces need no additional split. Stable geometric and name ordering makes
 * input permutations equivalent. Failure is atomic: invalid coverage, exhausted
 * leaf budgets, unrepresentable levels or colliding child names throw without
 * changing input. Low and high children append .0 and .1 to the parent ID,
 * increment its level and retain its root. This operation establishes rectangle
 * coverage and laminar interfaces only; C0 control relations, field
 * prolongation, approximation improvement and normal or source correspondence
 * remain consumer obligations.
 */

export namespace IAutoMovieRecoveryChartRefinementClosure {
  /**
   * Close a private rectangle split under laminar opposed interface intervals.
   * Bounds are global unit-square [u0,u1,v0,v1] coordinates; axes 0 and 1 vary
   * u and v. An exact endpoint sweep first establishes one covering layer over
   * every positive-area cell. Every subsequent strict split preserves that
   * partition without moving an endpoint. Proper overlaps propagate an existing
   * smaller end into the opposite leaf; identical, contained and disjoint
   * interfaces need no additional split. Stable geometric and name ordering
   * makes input permutations equivalent. Failure is atomic: invalid coverage,
   * exhausted leaf budgets, unrepresentable levels or colliding child names
   * throw without changing input. Low and high children append .0 and .1 to the
   * parent ID, increment its level and retain its root. This operation
   * establishes rectangle coverage and laminar interfaces only; C0 control
   * relations, field prolongation, approximation improvement and normal or
   * source correspondence remain consumer obligations.
   */

  export type Operation = (input: {
    /**
     * Current normalized chart leaves with stable identities and disjoint
     * interiors covering the declared domain.
     */
    leaves: readonly {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;

      /**
       * Identity of the original unrefined partition cell from which this leaf
       * descends.
       */
      root: string;

      /** Nonnegative subdivision depth below the original partition cell. */
      level: number;

      /**
       * Global normalized chart rectangle [u0,v0,u1,v1] with strictly
       * increasing extents.
       */
      bounds: readonly [number, number, number, number];
    }[];

    /**
     * Caller-requested leaf split before required interface-closure
     * propagation.
     */
    request: {
      /**
       * Stable identity of the chart leaf addressed by this split or collar
       * record.
       */
      leaf: string;
      /** Normalized chart axis: 0 selects u and 1 selects v. */
      axis: 0 | 1;
      /**
       * Global normalized coordinate of the requested split on the selected
       * axis.
       */
      parameter: number;
    };

    /**
     * Positive safe ceiling on the complete refined leaf population, including
     * interface-closure splits.
     */
    maxLeaves: number;
  }) => {
    /**
     * Current normalized chart leaves with stable identities and disjoint
     * interiors covering the declared domain.
     */
    leaves: {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;

      /**
       * Identity of the original unrefined partition cell from which this leaf
       * descends.
       */
      root: string;

      /** Nonnegative subdivision depth below the original partition cell. */
      level: number;

      /**
       * Global normalized chart rectangle [u0,v0,u1,v1] with strictly
       * increasing extents.
       */
      bounds: [number, number, number, number];
    }[];

    /**
     * Actual requested and interface-closure splits, in the order applied to
     * the leaf population.
     */
    splits: {
      /**
       * Stable identity of the chart leaf addressed by this split or collar
       * record.
       */
      leaf: string;

      /** Normalized chart axis: 0 selects u and 1 selects v. */
      axis: 0 | 1;

      /**
       * Global normalized coordinate of the requested split on the selected
       * axis.
       */
      parameter: number;

      /**
       * Actual termination or qualification reason; null, where allowed, means
       * no local failure was recorded.
       */
      reason: "requested" | "interface-closure";
    }[];

    /**
     * Observed admission failures and qualification limits in production order;
     * an empty array adds no extra certificate.
     */
    diagnostics: string[];
  };
}
