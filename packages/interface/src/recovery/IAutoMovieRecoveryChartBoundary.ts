import type { IAutoMovieCubicBezierCurve64 } from "../geometry/IAutoMovieCubicBezierCurve64";
import type { AutoMovieVector3Tuple, IAutoMoviePolylineFit } from "..";

/**
 * Own one fitted curve and accepted pointwise phase chart per private boundary
 * path. Private incidence words identify equality, including reversed order;
 * equal positions on different words never weld. Public boundary IDs are new
 * sequential identities. Each returned orientation uses the same canonical
 * coefficients and registration. Partial path overlaps remain distinct and
 * require a separate segmentation authority.
 */

export namespace IAutoMovieRecoveryChartBoundary {
  /**
   * Own one fitted curve and accepted pointwise phase chart per private
   * boundary path. Private incidence words identify equality, including
   * reversed order; equal positions on different words never weld. Public
   * boundary IDs are new sequential identities. Each returned orientation uses
   * the same canonical coefficients and registration. Partial path overlaps
   * remain distinct and require a separate segmentation authority.
   */

  export type Operation = (policy: {
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
  }) => {
    /**
     * Admits or reuses one complete boundary word; conflicting observations for
     * an existing word throw instead of reusing stale coefficients.
     */
    get: (
      word: readonly string[],
      pointsMm: readonly Readonly<AutoMovieVector3Tuple>[],
    ) => {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;

      /**
       * Whether this path uses the opposite direction from the canonical
       * incidence word.
       */
      reversed: boolean;

      /** Canonical identities of the boundary's first and last endpoints. */
      corners: [string, string];

      /**
       * Numerical coefficient-fit result; retained diagnostics do not establish
       * continuous source fidelity.
       */
      fit: IAutoMoviePolylineFit;

      /**
       * Strictly increasing normalized fitted phase at each raw boundary
       * observation, in this path's orientation.
       */
      parameters: number[];

      /**
       * Increasing normalized span-boundary parameters in this chart's boundary
       * orientation.
       */
      knots: number[];

      /**
       * Canonical oriented cubic authority with normalized phase, shared by
       * both incident chart directions.
       */
      canonicalCurve: IAutoMovieCubicBezierCurve64;

      /**
       * Increasing normalized span-boundary parameters in the canonical curve
       * orientation.
       */
      canonicalKnots: number[];
    };

    /**
     * Returns the current registry population without mutating the retained
     * observation state.
     */
    size: () => number;
  };
}
