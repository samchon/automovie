/**
 * Couple a complete axis-aligned unit-square leaf partition with C0 bicubics.
 * axis 0 edges increase in u; axis 1 edges increase in v. Patch sides are
 * bottom, right, top, left and all side parameters increase. Equal UV scalar
 * endpoint identities share one control; this is parameter identity, not a
 * physical coordinate weld. Each maximal containing interval owns one cubic.
 * Nested fine intervals use de Casteljau restriction expressions in that cubic.
 * Disjoint intervals, including those meeting only at endpoints, keep their own
 * cubic handles. Every patch retains four independent interior controls. Atomic
 * intervals verify one exterior incident and two opposed interior uses. Missing
 * exterior coverage, nonnested overlaps, inconsistent corner equations, cycles,
 * nonfinite arithmetic and control-budget exhaustion throw atomically. boundary
 * contains only master exterior controls, with their nominal affine UV
 * coefficient locations; physical fitted coefficients belong to the caller.
 * Binary64 restriction is algebraically exact before rounding. Canonical point
 * expressions own shared cut endpoints rather than separate restriction paths.
 * This helper supplies coefficient coupling, not source coverage, G1 or a
 * conforming generated mesh: the old four-ID-only engine cannot join unequal
 * intervals without canonical interval sample ownership.
 */

export namespace IAutoMovieRecoveryChartLeafControls {
  /**
   * Input observations and explicit numerical policy for
   * RecoveryChartLeafControls. Unique named rectangles covering the unit UV
   * square with disjoint interiors.
   */

  export type Input = {
    /**
     * Unique named rectangles covering the unit UV square with disjoint
     * interiors.
     */
    leaves: readonly {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;

      /**
       * Global normalized chart rectangle [u0,v0,u1,v1] with strictly
       * increasing extents.
       */
      bounds: readonly [number, number, number, number];
    }[];

    /**
     * Positive safe cap on every allocated corner, edge and interior control
     * ID.
     */
    maxControls: number;
  };

  /**
   * Returned coefficient or observation state from RecoveryChartLeafControls.
   * Master outer coefficients only; never dependent fine-edge controls.
   */

  export type Result = {
    /** Number of original IDs for the relation resolver and fitter. */
    controls: number;

    /** Sixteen original control IDs per patch, v rows with u varying fastest. */
    patches: {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;
      /**
       * Indices into the shared control registry; bicubic nets use sixteen IDs
       * with u varying fastest.
       */
      controlIds: number[];
    }[];

    /**
     * Dependent original controls as unchanged sparse master-control
     * expressions.
     */
    relations: {
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

    /** Master cubic intervals only, with increasing global varying coordinate. */
    edges: {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;

      /** Normalized chart axis: 0 selects u and 1 selects v. */
      axis: 0 | 1;

      /**
       * Fixed global normalized coordinate of the master edge on its nonvarying
       * axis.
       */
      line: number;

      /**
       * Increasing normalized interval start on the declared shared edge or
       * boundary curve.
       */
      start: number;

      /**
       * Increasing normalized interval end on the declared shared edge or
       * boundary curve.
       */
      end: number;

      /**
       * Indices into the shared control registry; bicubic nets use sixteen IDs
       * with u varying fastest.
       */
      controlIds: [number, number, number, number];
    }[];

    /** Increasing side intervals normalized to their declared master edge. */
    bindings: {
      /**
       * Patch identity or zero-based patch ordinal, according to this record,
       * addressing the supplied coefficient-patch registry.
       */
      patch: string;

      /**
       * Chart boundary-side ordinal in the owning rectangle's fixed side
       * convention.
       */
      side: 0 | 1 | 2 | 3;

      /**
       * Declared undirected edge identity; halfedge occurrences retain their
       * own direction and source-face ownership.
       */
      edge: string;

      /**
       * Increasing normalized interval start on the declared shared edge or
       * boundary curve.
       */
      start: number;

      /**
       * Increasing normalized interval end on the declared shared edge or
       * boundary curve.
       */
      end: number;
    }[];

    /** Master outer coefficients only; never dependent fine-edge controls. */
    boundary: {
      /** Original control-registry index addressed by this boundary constraint. */
      control: number;
      /**
       * Normalized u coordinate in the declared local patch or unit source
       * chart.
       */
      u: number;
      /**
       * Normalized v coordinate in the declared local patch or unit source
       * chart.
       */
      v: number;
    }[];
  };

  /**
   * Couple a complete axis-aligned unit-square leaf partition with C0 bicubics.
   * axis 0 edges increase in u; axis 1 edges increase in v. Patch sides are
   * bottom, right, top, left and all side parameters increase. Equal UV scalar
   * endpoint identities share one control; this is parameter identity, not a
   * physical coordinate weld. Each maximal containing interval owns one cubic.
   * Nested fine intervals use de Casteljau restriction expressions in that
   * cubic. Disjoint intervals, including those meeting only at endpoints, keep
   * their own cubic handles. Every patch retains four independent interior
   * controls. Atomic intervals verify one exterior incident and two opposed
   * interior uses. Missing exterior coverage, nonnested overlaps, inconsistent
   * corner equations, cycles, nonfinite arithmetic and control-budget
   * exhaustion throw atomically. boundary contains only master exterior
   * controls, with their nominal affine UV coefficient locations; physical
   * fitted coefficients belong to the caller. Binary64 restriction is
   * algebraically exact before rounding. Canonical point expressions own shared
   * cut endpoints rather than separate restriction paths. This helper supplies
   * coefficient coupling, not source coverage, G1 or a conforming generated
   * mesh: the old four-ID-only engine cannot join unequal intervals without
   * canonical interval sample ownership.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartLeafControls.Input,
  ) => IAutoMovieRecoveryChartLeafControls.Result;
}
