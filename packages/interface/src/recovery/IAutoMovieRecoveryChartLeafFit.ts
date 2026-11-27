import type {
  AutoMovieVector3Tuple,
  IAutoMoviePolylineFit,
  IAutoMovieRecoveryChartCollar,
  IAutoMovieRecoveryChartFit,
  IAutoMovieRecoveryChartLeafControls,
} from "..";

/**
 * Fit a boundary collar with affine hanging-control constraints against private
 * PL observations. Each leaf is an axis-aligned UV rectangle, so clipping and
 * local coordinates preserve the physical-area polynomial objective. Adaptive
 * attempts split residual-marked leaves at their observed UV locations and
 * close opposed interface intervals. Exhausted or incompatible attempts retain
 * the previous field. Returned edge identities are coefficient relations, not
 * source topology or G1 claims. Optional physical-gradient observations change
 * the declared fitting objective. Their millimetre exchange length scales with
 * physical units. Refinement retains the preceding candidate unless the
 * combined objective improves without worsening its original physical-area
 * position RMS. Every attempt reuses the initial coefficient enclosure;
 * restricting a boundary cubic cannot silently shrink the feasible box. Point
 * fallback supplies no gradient fit.
 */

export namespace IAutoMovieRecoveryChartLeafFit {
  /**
   * Input observations and explicit numerical policy for RecoveryChartLeafFit.
   * Stable chart identity retained by the fitted patch family.
   */

  export type Input = {
    /** Stable chart identity retained by the fitted patch family. */
    name: string;

    /** Private physical chart observations in millimetres. */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /** Original private triangle incidence used by physical-area integration. */
    triangles: readonly (readonly [number, number, number])[];

    /** Chart-local UV coordinates aligned with the private vertices. */
    parameters: readonly (readonly number[])[];

    /** Complete fitted boundary cubic results, one per chart side. */
    curves: readonly IAutoMoviePolylineFit[];

    /**
     * Four increasing normalized phase partitions for the authoritative side
     * cubics.
     */
    knots: readonly [
      readonly number[],
      readonly number[],
      readonly number[],
      readonly number[],
    ];

    /**
     * Requested correspondence residual in millimetres, independent of
     * embedding.
     */
    toleranceMm: number;

    /** Positive maximum retained leaf patches in one fit attempt. */
    maxPatches: number;

    /** Positive numerical solver iteration limit per attempted fit. */
    maxIterations: number;

    /** Explicit maximum physical-area observation rows per attempt. */
    maxObservationRows: number;

    /** Maximum residual-driven refinement waves after the initial fit. */
    maxRefinements: number;

    /**
     * Optional nonnegative millimetre exchange length for physical-gradient
     * rows; zero or omission disables the gradient objective.
     */
    physicalGradientLengthMm?: number;
  };

  /**
   * Returned coefficient or observation state from RecoveryChartLeafFit. Patch
   * populations attempted in each recorded refinement round.
   */

  export type Result = {
    /**
     * Returned complete millimetre coefficient registry with fixed boundary
     * authority.
     */
    controlsMm: Readonly<AutoMovieVector3Tuple>[];

    /** Fitted leaf identities and row-major sixteen-control registry references. */
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
     * Combined numerical and declared observation acceptance, without an
     * embedding claim.
     */
    qualified: boolean;

    /**
     * Joint fit diagnostics with coefficients owned by controlsMm instead of
     * duplicated here.
     */
    joint: Omit<IAutoMovieRecoveryChartFit.Result, "controls">;

    /** Retained leaves, shared edges and physical boundary-control bindings. */
    leafLayout: {
      /**
       * Current normalized chart leaves with stable identities and disjoint
       * interiors covering the declared domain.
       */
      leaves: ReturnType<IAutoMovieRecoveryChartCollar.Operation>["leaves"];

      /**
       * Undirected edge-incidence registry with the actual incident faces or
       * master-control bindings.
       */
      edges: ReturnType<IAutoMovieRecoveryChartLeafControls.Operation>["edges"];

      /**
       * Normalized chart-side intervals bound to their corresponding shared
       * master edges.
       */
      bindings: ReturnType<IAutoMovieRecoveryChartLeafControls.Operation>["bindings"];
    };

    /**
     * Physical source-area quadrature population and its independent
     * qualification.
     */
    areaObservation: {
      /**
       * Combined numerical and declared observation acceptance, without an
       * embedding claim.
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

    /** Actual refinement history, residuals and attempted patch populations. */
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

  /**
   * Fit a boundary collar with affine hanging-control constraints against
   * private PL observations. Each leaf is an axis-aligned UV rectangle, so
   * clipping and local coordinates preserve the physical-area polynomial
   * objective. Adaptive attempts split residual-marked leaves at their observed
   * UV locations and close opposed interface intervals. Exhausted or
   * incompatible attempts retain the previous field. Returned edge identities
   * are coefficient relations, not source topology or G1 claims. Optional
   * physical-gradient observations change the declared fitting objective. Their
   * millimetre exchange length scales with physical units. Refinement retains
   * the preceding candidate unless the combined objective improves without
   * worsening its original physical-area position RMS. Every attempt reuses the
   * initial coefficient enclosure; restricting a boundary cubic cannot silently
   * shrink the feasible box. Point fallback supplies no gradient fit.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartLeafFit.Input,
  ) => IAutoMovieRecoveryChartLeafFit.Result;
}
