import type {
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryChartBoundary,
  IAutoMovieRecoveryChartLeafFit,
} from "..";

/**
 * Assemble fitted chart fields using one canonical boundary coefficient
 * registry. Equal declared boundary intervals share four exact coefficient IDs,
 * including reversal; coincident independent sheets retain distinct IDs.
 * Different edge partitions retain common analytic curves but report unmatched
 * tessellation spans. Physical transverse jets and coarse/fine edge-sample
 * conformity are separate work. Stored oriented knots map directly to their
 * canonical counterparts without a subtraction round trip. Each canonical
 * endpoint has one evaluation owner; its binary64 restriction difference is
 * measured against the fitted field below.
 */

export namespace IAutoMovieRecoveryChartAssembly {
  /**
   * Assemble fitted chart fields using one canonical boundary coefficient
   * registry. Equal declared boundary intervals share four exact coefficient
   * IDs, including reversal; coincident independent sheets retain distinct IDs.
   * Different edge partitions retain common analytic curves but report
   * unmatched tessellation spans. Physical transverse jets and coarse/fine
   * edge-sample conformity are separate work. Stored oriented knots map
   * directly to their canonical counterparts without a subtraction round trip.
   * Each canonical endpoint has one evaluation owner; its binary64 restriction
   * difference is measured against the fitted field below.
   */

  export type Operation = (
    charts: readonly {
      /**
       * Caller-assigned stable semantic identity retained in generated
       * coefficient and observation records.
       */
      name: string;

      /**
       * Bernstein control positions in the common registered millimetre frame,
       * ordered by control registry ID.
       */
      controlsMm: readonly Readonly<AutoMovieVector3Tuple>[];

      /**
       * Bicubic coefficient patches indexed by the shared control registry,
       * with u varying fastest within each v row.
       */
      patches: readonly {
        /**
         * Stable identity within the owning chart, boundary or occurrence
         * registry; equal coordinates do not create identity.
         */
        id: string;
        /**
         * Indices into the shared control registry; bicubic nets use sixteen
         * IDs with u varying fastest.
         */
        controlIds: readonly number[];
      }[];

      /**
       * Increasing normalized u/v break arrays defining the initial tensor
       * patch partition.
       */
      partition: {
        /**
         * Increasing normalized u-axis partition coordinates spanning the
         * declared chart domain.
         */
        u: readonly number[];
        /**
         * Increasing normalized v-axis partition coordinates spanning the
         * declared chart domain.
         */
        v: readonly number[];
      };

      /**
       * Oriented fitted boundary results used by this chart; each refers back
       * to a shared canonical coefficient authority.
       */
      boundaries: readonly ReturnType<
        ReturnType<IAutoMovieRecoveryChartBoundary.Operation>["get"]
      >[];

      /**
       * Conforming refined leaf rectangles with shared-edge/control bindings;
       * omission means the tensor partition is used.
       */
      leafLayout?: ReturnType<IAutoMovieRecoveryChartLeafFit.Operation>["leafLayout"];
    }[],
  ) => {
    /**
     * Bernstein control positions in the common registered millimetre frame,
     * ordered by control registry ID.
     */
    controlsMm: Readonly<AutoMovieVector3Tuple>[];

    /**
     * Bicubic coefficient patches indexed by the shared control registry, with
     * u varying fastest within each v row.
     */
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
     * Observed admission failures and qualification limits in production order;
     * an empty array adds no extra certificate.
     */
    diagnostics: string[];

    /**
     * Largest discrepancy from canonical shared-boundary restriction, in
     * millimetres.
     */
    maximumCanonicalRestrictionDifferenceMm: number;

    /**
     * Count of coefficient spans participating in admitted shared boundary
     * authorities.
     */
    sharedBoundarySpans: number;

    /** Count of supplied boundary spans without a matching chart binding. */
    unmatchedBoundarySpans: number;

    /**
     * Canonical shared-boundary coefficient authorities consumed by engine
     * atlas admission.
     */
    boundaryAuthorities?: IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"];

    /**
     * Chart-side intervals referring to the canonical boundary authorities,
     * retaining direction and phase bounds.
     */
    boundaryBindings?: IAutoMovieBicubicAtlasGeometry["boundaryBindings"];
  };
}
