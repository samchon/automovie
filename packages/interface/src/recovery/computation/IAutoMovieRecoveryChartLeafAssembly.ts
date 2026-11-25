import type {
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryChartBoundary,
  IAutoMovieRecoveryChartLeafFit,
} from "../../index";

/**
 * Publish source-free canonical intervals for a fitted rectangular leaf atlas.
 * Internal master edges retain their fitted coefficient owners. Outer edges use
 * the original shared fitted boundary span and oriented restriction metadata.
 * Each chart owns a separate analytic normal fan; positional sharing never
 * averages the transverse derivatives of a crease or claims G1 continuity.
 */

export namespace IAutoMovieRecoveryChartLeafAssembly {
  /**
   * Publish source-free canonical intervals for a fitted rectangular leaf
   * atlas. Internal master edges retain their fitted coefficient owners. Outer
   * edges use the original shared fitted boundary span and oriented restriction
   * metadata. Each chart owns a separate analytic normal fan; positional
   * sharing never averages the transverse derivatives of a crease or claims G1
   * continuity.
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
      leafLayout: ReturnType<IAutoMovieRecoveryChartLeafFit.Operation>["leafLayout"];
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
    patches: IAutoMovieBicubicAtlasGeometry["patches"];

    /**
     * Canonical shared-boundary coefficient authorities consumed by engine
     * atlas admission.
     */
    boundaryAuthorities: NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
    >;

    /**
     * Chart-side intervals referring to the canonical boundary authorities,
     * retaining direction and phase bounds.
     */
    boundaryBindings: NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
    >;

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
  };
}
