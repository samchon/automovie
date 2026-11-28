import type {
  AutoMovieVector3Tuple,
  IAutoMoviePolylineFit,
  IAutoMovieRecoveryChartCollar,
  IAutoMovieRecoveryChartFit,
  IAutoMovieRecoveryChartLeafControls,
} from "..";

/**
 * Prepared private leaf fitting input, generated coefficients and qualification
 * diagnostics.
 */

export namespace IAutoMovieRecoveryChartLeafFit {
  /**
   * Supply a registered source chart, shared boundary curves, knot layout,
   * physical tolerance and explicit limits for fitting and refinement.
   */

  export type Input = {
    /** Stable chart identity used for local generated patch names. */
    name: string;

    /** Original source vertex positions in registered millimetres. */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /** Oriented index triples into those source vertices. */
    triangles: readonly (readonly [number, number, number])[];

    /** Global normalized [u, v] values aligned with original vertices. */
    parameters: readonly (readonly number[])[];

    /** Retained exterior cubic boundary authorities in chart-side order. */
    curves: readonly IAutoMoviePolylineFit[];

    /** Initial normalized shared boundary partition coordinates. */
    knots: readonly [
      readonly number[],
      readonly number[],
      readonly number[],
      readonly number[],
    ];

    /** Physical sampled position tolerance in millimetres. */
    toleranceMm: number;

    /** Maximum patches after initial and propagated refinement splits. */
    maxPatches: number;

    /** Maximum projected solve iterations per attempted layout. */
    maxIterations: number;

    /** Maximum observed area rows in one attempted layout. */
    maxObservationRows: number;

    /** Maximum residual refinement rounds. */
    maxRefinements: number;

    /**
     * Optional positive millimetre exchange length for physical gradient
     * fitting.
     */
    physicalGradientLengthMm?: number;
  };

  /**
   * Fitted leaf coefficient registry, shared-boundary layout and sampled
   * numerical qualification. Independent area and refinement diagnostics
   * describe the attempted work.
   */

  export type Result = {
    /** Fitted registered millimetre control registry. */
    controlsMm: Readonly<AutoMovieVector3Tuple>[];

    /** Generated leaf patch nets addressed by the fitted control registry. */
    patches: {
      /** Stable generated leaf patch identifier. */
      id: string;
      /** Sixteen registry control IDs in U-fastest Bernstein order. */
      controlIds: number[];
    }[];

    /** Whether available area observation and joint numerical gates pass. */
    qualified: boolean;

    /**
     * Complete joint fit and sampled qualification report of the returned
     * layout.
     */
    joint: Omit<IAutoMovieRecoveryChartFit.Result, "controls">;

    /** Retained chart leaf identity and canonical edge topology. */
    leafLayout: {
      /** Generated rectangles at the returned refinement state. */
      leaves: ReturnType<IAutoMovieRecoveryChartCollar.Operation>["leaves"];

      /** Master edge definitions used by the generated leaves. */
      edges: ReturnType<IAutoMovieRecoveryChartLeafControls.Operation>["edges"];

      /** Mappings from leaf sides into master edge authority. */
      bindings: ReturnType<IAutoMovieRecoveryChartLeafControls.Operation>["bindings"];
    };

    /** Measured area observation and integration outcomes for this fit. */
    areaObservation: {
      /** Whether area construction completed for the returned layout. */
      qualified: boolean;

      /** Actual weighted area sample count used by the layout. */
      rows: number;

      /** Physical original chart area in square millimetres when measured. */
      sourceAreaMm2: number;

      /** Lower quadrature row estimate derived from the known source population. */
      quadratureMinimumRows: number;

      /** Physical integrated clipped area in square millimetres when available. */
      integratedAreaMm2: number | null;

      /** Largest reported relative area-accounting discrepancy, if measured. */
      maximumRelativeAreaDiscrepancy: number | null;

      /** Observed area or fit refusal reason when available. */
      reason: string | null;
    };

    /** Measured refinement history and local stopping reason. */
    refinement: {
      /** Number of refinement rounds performed. */
      rounds: number;

      /** Observed reason that further refinement terminated. */
      reason: string;

      /** Series of measured maximum position residuals in millimetres. */
      residualsMm: number[];

      /** Series of measured area-weighted position RMS values in millimetres. */
      areaRmsMm: (number | null)[];

      /** Patch counts considered during refinement attempts. */
      attemptedPatches: number[];
    };
  };

  /**
   * Prepare a leaf registry and anchored boundary controls, assemble
   * area-weighted fitting rows, and solve each candidate layout. Refine
   * residual-marked leaves under the configured closure and patch limits.
   * Return fitted coefficients and available area and refinement measurements.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartLeafFit.Input,
  ) => IAutoMovieRecoveryChartLeafFit.Result;
}
