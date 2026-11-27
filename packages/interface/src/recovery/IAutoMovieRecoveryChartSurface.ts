import type {
  AutoMovieVector3Tuple,
  IAutoMoviePolylineFit,
  IAutoMovieRecoveryChartBoundary,
  IAutoMovieRecoveryChartFit,
  IAutoMovieRecoveryChartLeafFit,
  IAutoMovieRecoveryChartMap,
} from "..";

/**
 * Fit one observed orientable disk whose four boundary paths are already
 * identified. Paths include their shared endpoints and contain private vertex
 * ordinals.
 */

export namespace IAutoMovieRecoveryChartSurface {
  /**
   * Fit one observed orientable disk whose four boundary paths are already
   * identified. Paths include their shared endpoints and contain private vertex
   * ordinals.
   */

  export type Fit = (input: {
    /**
     * Caller-assigned stable semantic identity retained in generated
     * coefficient and observation records.
     */
    name: string;

    /**
     * Borrowed physical positions in the registered millimetre frame; indices
     * in triangles address this array.
     */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /**
     * Oriented triangle vertex-index triples addressing the paired position
     * array; indices are not control IDs.
     */
    triangles: readonly (readonly [number, number, number])[];

    /**
     * Four ordered chart-boundary vertex paths in the chart owner's fixed side
     * convention; indices address verticesMm.
     */
    sides: readonly [
      readonly number[],
      readonly number[],
      readonly number[],
      readonly number[],
    ];

    /**
     * Positive finite requested positional discrepancy in millimetres; it is
     * not a continuous-surface certificate.
     */
    toleranceMm: number;

    /**
     * Positive integer ceiling on fitted cubic spans; exhausting it refuses the
     * affected fit.
     */
    maxSpans: number;

    /**
     * Declared turning-angle threshold in degrees for preserving an independent
     * corner tangent.
     */
    cornerDegrees: number;

    /**
     * Positive integer ceiling on emitted chart patches; the fitter reports
     * unresolved refinement at the limit.
     */
    maxPatches: number;

    /**
     * Explicit positive numerical iteration ceiling; exhaustion remains a
     * reported termination, not convergence.
     */
    maxIterations: number;

    /**
     * Optional ceiling on retained area-quadrature observation rows; omission
     * admits at most 250,000 rows per fit.
     */
    maxObservationRows?: number;

    /**
     * Optional ceiling on residual-driven refinement rounds; omission permits
     * four rounds after the initial fit.
     */
    maxRefinements?: number;

    /**
     * Optional nonnegative millimetre exchange length multiplying physical
     * derivatives; zero or omission disables that objective term.
     */
    physicalGradientLengthMm?: number;

    /**
     * Oriented fitted boundary results used by this chart; each refers back to
     * a shared canonical coefficient authority.
     */
    boundaries?: readonly ReturnType<
      ReturnType<IAutoMovieRecoveryChartBoundary.Operation>["get"]
    >[];
  }) => {
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
     * Whether the owning operation's explicit numerical/topological admission
     * predicates passed; no stronger surface or fidelity claim follows.
     */
    qualified: boolean;

    /**
     * One oriented fitted boundary and its normalized pointwise correspondence
     * to the canonical curve.
     */
    boundary: IAutoMoviePolylineFit[];

    /**
     * Admitted source-observation to normalized-chart parameter map; source
     * topology remains acquisition-only.
     */
    map: IAutoMovieRecoveryChartMap.Result;

    /**
     * Joint coefficient-fit diagnostics with coefficient arrays omitted because
     * the enclosing result owns them.
     */
    joint: Omit<IAutoMovieRecoveryChartFit.Result, "controls">;

    /**
     * Increasing normalized u/v break arrays defining the initial tensor patch
     * partition.
     */
    partition: {
      /**
       * Increasing normalized u-axis partition coordinates spanning the
       * declared chart domain.
       */
      u: number[];
      /**
       * Increasing normalized v-axis partition coordinates spanning the
       * declared chart domain.
       */
      v: number[];
    };

    /**
     * C0-only certifies positional boundary sharing without promising matching
     * transverse derivatives.
     */
    continuity: "C0-only";

    /**
     * Conforming refined leaf rectangles with shared-edge/control bindings;
     * omission means the tensor partition is used.
     */
    leafLayout: ReturnType<IAutoMovieRecoveryChartLeafFit.Operation>["leafLayout"];

    /**
     * Area-quadrature admission and coverage diagnostics, independent of the
     * subsequent coefficient residual.
     */
    areaObservation: {
      /**
       * Whether the owning operation's explicit numerical/topological admission
       * predicates passed; no stronger surface or fidelity claim follows.
       */
      qualified: boolean;

      /** Actual quadrature row population retained for the current chart solve. */
      rows: number;

      /** Area of the supplied physical source triangles, in square millimetres. */
      sourceAreaMm2: number;

      /**
       * Minimum row population needed to integrate the complete current chart
       * partition.
       */
      quadratureMinimumRows: number;

      /**
       * Area represented by accepted quadrature, in square millimetres; null
       * means unavailable.
       */
      integratedAreaMm2: number | null;

      /**
       * Largest dimensionless relative mismatch between source and integrated
       * child area; null means unavailable.
       */
      maximumRelativeAreaDiscrepancy: number | null;

      /**
       * Actual termination or qualification reason; null, where allowed, means
       * no local failure was recorded.
       */
      reason: string | null;
    };

    /**
     * Actual residual-driven refinement history, including incomplete attempts
     * and their reasons.
     */
    refinement: {
      /**
       * Number of refinement rounds actually attempted; zero means the initial
       * layout was sufficient or refused.
       */
      rounds: number;

      /**
       * Actual termination or qualification reason; null, where allowed, means
       * no local failure was recorded.
       */
      reason: string;

      /**
       * Per-round maximum observation discrepancies, in millimetres, preserving
       * attempted round order.
       */
      residualsMm: number[];

      /**
       * Per-round area-weighted position residual RMS in millimetres; null
       * entries mean quadrature was unavailable.
       */
      areaRmsMm: (number | null)[];

      /** Patch populations attempted in each recorded refinement round. */
      attemptedPatches: number[];
    };
  };
}
