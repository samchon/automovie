import type {
  IAutoMovieRecoveryChartBoundaryNetwork,
  IAutoMovieRecoveryChartSurface,
} from "../../index";

/**
 * Fit a selected private chart batch after one common boundary-network pass.
 * All chart families enter the same network before any coefficient solve, so
 * observed quarter cuts and maximal physical arcs can be reconciled across
 * selected slabs. Chart names retain the caller's private ownership metadata. A
 * failed global network falls back to explicitly unqualified independent
 * networks, preserving finite siblings without claiming shared-bank continuity.
 * Failed maps and fits remain local results and never supply a source mesh.
 */

export namespace IAutoMovieRecoveryChartBatch {
  /**
   * Fit a selected private chart batch after one common boundary-network pass.
   * All chart families enter the same network before any coefficient solve, so
   * observed quarter cuts and maximal physical arcs can be reconciled across
   * selected slabs. Chart names retain the caller's private ownership metadata.
   * A failed global network falls back to explicitly unqualified independent
   * networks, preserving finite siblings without claiming shared-bank
   * continuity. Failed maps and fits remain local results and never supply a
   * source mesh.
   */

  export type Operation = (input: {
    /**
     * Prepared or fitted source charts in deterministic observation order,
     * including each independently retained feature piece.
     */
    charts: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0]["charts"];

    /**
     * Shared boundary registry for this immutable observation pass; its
     * lifetime ends when the caller releases the pass.
     */
    owner: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0]["owner"];

    /**
     * Explicit fitting and work-limit policy shared by all chart jobs in this
     * batch.
     */
    fit: {
      /**
       * Positive finite requested positional discrepancy in millimetres; it is
       * not a continuous-surface certificate.
       */
      toleranceMm: number;

      /**
       * Positive integer ceiling on fitted cubic spans; exhausting it refuses
       * the affected fit.
       */
      maxSpans: number;

      /**
       * Declared turning-angle threshold in degrees for preserving an
       * independent corner tangent.
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
    };
  }) => Generator<
    {
      /**
       * Caller-assigned stable semantic identity retained in generated
       * coefficient and observation records.
       */
      name: string;

      /**
       * Prepared or fitted chart record whose source correspondence and
       * coefficient authority remain separately qualified.
       */
      chart:
        | ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation>["charts"][number]
        | null;

      /**
       * Numerical coefficient-fit result; retained diagnostics do not establish
       * continuous source fidelity.
       */
      fit: ReturnType<IAutoMovieRecoveryChartSurface.Fit> | null;

      /**
       * Actual termination or qualification reason; null, where allowed, means
       * no local failure was recorded.
       */
      reason: string | null;

      /**
       * Whether all participating chart boundaries share the admitted
       * coefficient authorities.
       */
      sharedBoundaryQualified: boolean;

      /** Largest boundary-network observation displacement, in millimetres. */
      networkMaximumPointChangeMm: number;

      /**
       * Observed admission failures and qualification limits in production
       * order; an empty array adds no extra certificate.
       */
      diagnostics: string[];
    },
    void,
    void
  >;
}
