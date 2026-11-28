import type {
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryChartBoundary,
  IAutoMovieRecoveryChartLeafFit,
} from "..";

/** Callable assembly of fitted chart coefficient registries into one atlas. */

export namespace IAutoMovieRecoveryChartAssembly {
  /**
   * Merge chart controls and patch references with chart-scoped patch IDs and
   * explicit boundary orientation. Reconcile matching shared boundary
   * authorities with canonical bindings, and keep unmatched boundary evidence
   * visible. Registered controls remain in millimetres.
   */

  export type Operation = (
    charts: readonly {
      /** Stable chart name used to address its generated patches. */
      name: string;

      /** Fitted chart-local control positions in registered millimetres. */
      controlsMm: readonly Readonly<AutoMovieVector3Tuple>[];

      /** Local patch nets addressed through the chart's fitted registry. */
      patches: readonly {
        /** Local fitted patch identifier within this chart. */
        id: string;
        /** Sixteen local control indices per patch in U-fastest order. */
        controlIds: readonly number[];
      }[];

      /** Tensor knot coordinates used to map chart patch and boundary ordinals. */
      partition: {
        /** Ordered normalized U partition knots. */
        u: readonly number[];
        /** Ordered normalized V partition knots. */
        v: readonly number[];
      };

      /**
       * Declared sides and oriented curve spans that supply canonical boundary
       * authority.
       */
      boundaries: readonly ReturnType<
        ReturnType<IAutoMovieRecoveryChartBoundary.Operation>["get"]
      >[];

      /**
       * Optional rectangular leaf registries. Complete leaf layouts select leaf
       * assembly.
       */
      leafLayout?: ReturnType<IAutoMovieRecoveryChartLeafFit.Operation>["leafLayout"];
    }[],
  ) => {
    /** Combined generated control registry in registered millimetres. */
    controlsMm: Readonly<AutoMovieVector3Tuple>[];

    /** Combined patch list addressing the returned registry. */
    patches: {
      /** Generated patch id scoped to its source chart. */
      id: string;
      /** Sixteen combined control indices in U-fastest Bernstein order. */
      controlIds: number[];
    }[];

    /** Available unmatched-span, boundary and numerical assembly findings. */
    diagnostics: string[];

    /**
     * Largest measured difference between canonical restriction and fitted
     * boundary positions, in millimetres.
     */
    maximumCanonicalRestrictionDifferenceMm: number;

    /** Number of retained spans that share a declared boundary authority. */
    sharedBoundarySpans: number;

    /**
     * Number of observed spans with no matching retained partition on the
     * opposite authority use.
     */
    unmatchedBoundarySpans: number;

    /**
     * Canonical boundary curve authorities emitted by the applicable assembly
     * route.
     */
    boundaryAuthorities?: IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"];

    /** Oriented patch-side bindings into the canonical authorities. */
    boundaryBindings?: IAutoMovieBicubicAtlasGeometry["boundaryBindings"];
  };
}
