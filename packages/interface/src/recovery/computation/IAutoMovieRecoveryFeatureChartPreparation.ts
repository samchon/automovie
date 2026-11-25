import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryDiskChart,
  IAutoMovieRecoveryFeatureChartCuts,
} from "../../index";

/**
 * Prepare privately cut feature banks for a common four-arc boundary network.
 * Unique occurrence keys guide auxiliary cuts; repeated physical keys retain
 * source identity without welding private fans. Every output remains an
 * observation chart. Closed components and failed topology or disk admissions
 * stay unsupported.
 */

export namespace IAutoMovieRecoveryFeatureChartPreparation {
  /**
   * Prepare privately cut feature banks for a common four-arc boundary network.
   * Unique occurrence keys guide auxiliary cuts; repeated physical keys retain
   * source identity without welding private fans. Every output remains an
   * observation chart. Closed components and failed topology or disk admissions
   * stay unsupported.
   */

  export type Operation = (
    input: Parameters<IAutoMovieRecoveryFeatureChartCuts.Operation>[0] & {
      /**
       * Caller-assigned stable semantic identity retained in generated
       * coefficient and observation records.
       */
      name: string;

      /**
       * Declared turning-angle threshold in degrees for preserving an
       * independent corner tangent.
       */
      cornerDegrees: number;

      /**
       * Positive integer ceiling on prepared charts, including pieces split by
       * declared features.
       */
      maxCharts: number;
    },
  ) => {
    /**
     * Prepared or fitted source charts in deterministic observation order,
     * including each independently retained feature piece.
     */
    charts: {
      /**
       * Caller-assigned stable semantic identity retained in generated
       * coefficient and observation records.
       */
      name: string;

      /**
       * Borrowed physical positions in the registered millimetre frame; indices
       * in triangles address this array.
       */
      verticesMm: Readonly<AutoMovieVector3Tuple>[];

      /**
       * Oriented triangle vertex-index triples addressing the paired position
       * array; indices are not control IDs.
       */
      triangles: [number, number, number][];

      /**
       * Per-vertex physical incidence identities shared only under declared
       * source equality.
       */
      physicalKeys: string[];

      /**
       * Four ordered chart-boundary vertex paths in the chart owner's fixed
       * side convention; indices address verticesMm.
       */
      sides: [number[], number[], number[], number[]];

      /**
       * Admitted new boundary vertices with original edge identities and
       * explicit interpolation fractions.
       */
      insertions: ReturnType<IAutoMovieRecoveryDiskChart.Operation>["insertedBoundaryVertices"];

      /**
       * Original source-face ordinals belonging to this observed chart or
       * feature.
       */
      sourceFaces: number[];
    }[];

    /**
     * Chart preparation refusals with original source ownership and explicit
     * reasons; no substitute chart is emitted.
     */
    unsupported: {
      /** Stable identity of the observed or prepared chart. */
      chart: string;
      /**
       * Actual termination or qualification reason; null, where allowed, means
       * no local failure was recorded.
       */
      reason: string;
      /**
       * Original source-face ordinals belonging to this observed chart or
       * feature.
       */
      sourceFaces: number[];
    }[];

    /**
     * Number of admitted crease arcs used to split the source observation
     * charts.
     */
    featureArcs: number;

    /**
     * Reported upper displacement introduced by admitted source-chart
     * subdivision, in millimetres.
     */
    observationDisplacementUpperMm: number;

    /**
     * Observed admission failures and qualification limits in production order;
     * an empty array adds no extra certificate.
     */
    diagnostics: string[];
  };
}
