/**
 * Callable application of one rectangular leaf split and its required interface
 * closure.
 */

export namespace IAutoMovieRecoveryChartRefinementClosure {
  /**
   * Split the named leaf on the requested normalized axis and propagate any
   * corresponding closure splits needed by neighboring leaf intervals. Preserve
   * root lineage and validate that the result remains a single covering
   * partition. Refuse a split that exceeds the complete leaf budget.
   */

  export type Operation = (input: {
    /** Current complete rectangular leaf cover in the normalized chart. */
    leaves: readonly {
      /** Stable ID of this current chart leaf. */
      id: string;

      /** Original root leaf from which this leaf descends. */
      root: string;

      /** Subdivision depth below the original partition. */
      level: number;

      /** Global normalized bounds [uMin, uMax, vMin, vMax]. */
      bounds: readonly [number, number, number, number];
    }[];

    /** Initial requested split before interface closure. */
    request: {
      /** Existing leaf ID addressed by the split. */
      leaf: string;
      /** Normalized chart split axis, 0 for U or 1 for V. */
      axis: 0 | 1;
      /** Global normalized split coordinate inside the leaf. */
      parameter: number;
    };

    /** Positive safe ceiling on the complete refined leaf population. */
    maxLeaves: number;
  }) => {
    /** Complete ordered leaf set after requested and propagated splits. */
    leaves: {
      /** Stable retained or newly created leaf ID. */
      id: string;

      /** Original root partition cell of this leaf. */
      root: string;

      /** Subdivision depth of the retained leaf. */
      level: number;

      /** Retained normalized leaf bounds [uMin, uMax, vMin, vMax]. */
      bounds: [number, number, number, number];
    }[];

    /** Applied requested and propagated splits in execution order. */
    splits: {
      /** Leaf ID split at this step. */
      leaf: string;

      /** Normalized axis of the applied split. */
      axis: 0 | 1;

      /** Global normalized coordinate used by that split. */
      parameter: number;

      /** Whether the step was requested or required by interface closure. */
      reason: "requested" | "interface-closure";
    }[];

    /** Observed closure and partition findings retained in order. */
    diagnostics: string[];
  };
}
