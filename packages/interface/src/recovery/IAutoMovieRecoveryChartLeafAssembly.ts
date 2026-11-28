import type {
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryChartBoundary,
  IAutoMovieRecoveryChartLeafFit,
} from "..";

/**
 * Callable assembly of fitted rectangular leaves and their canonical boundary
 * authorities.
 */

export namespace IAutoMovieRecoveryChartLeafAssembly {
  /**
   * Combine fitted leaf nets and bind interior intervals to their master
   * coefficients. Retain original oriented boundary spans for exterior
   * restrictions. Report unmatched spans and restriction differences, and
   * retain each chart's distinct normal fans.
   */

  export type Operation = (
    charts: readonly {
      /** Source chart name used to scope generated patch ids. */
      name: string;

      /** Fitted chart-local coefficients in registered millimetres. */
      controlsMm: readonly Readonly<AutoMovieVector3Tuple>[];

      /** Leaf patch control nets in their chart's fitted registry. */
      patches: readonly {
        /** Identifier addressing a leaf patch within the source chart. */
        id: string;
        /** Sixteen local U-fastest Bernstein control ids. */
        controlIds: readonly number[];
      }[];

      /**
       * Declared original exterior curve authority and its oriented restriction
       * metadata.
       */
      boundaries: readonly ReturnType<
        ReturnType<IAutoMovieRecoveryChartBoundary.Operation>["get"]
      >[];

      /** Fitted leaf layout with interior master edges and local range bindings. */
      leafLayout: ReturnType<IAutoMovieRecoveryChartLeafFit.Operation>["leafLayout"];
    }[],
  ) => {
    /** Combined registered millimetre control positions. */
    controlsMm: Readonly<AutoMovieVector3Tuple>[];

    /** Combined patched geometry records referencing the generated registry. */
    patches: IAutoMovieBicubicAtlasGeometry["patches"];

    /** Canonical master and exterior curve authorities retained by assembly. */
    boundaryAuthorities: NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
    >;

    /** Oriented patch-side parameter maps into each retained authority. */
    boundaryBindings: NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
    >;

    /** Numerical restriction and unresolved sharing findings. */
    diagnostics: string[];

    /** Largest measured restriction difference, in millimetres. */
    maximumCanonicalRestrictionDifferenceMm: number;

    /** Number of retained shared boundary spans. */
    sharedBoundarySpans: number;

    /** Number of boundary spans without a retained matching partner. */
    unmatchedBoundarySpans: number;
  };
}
