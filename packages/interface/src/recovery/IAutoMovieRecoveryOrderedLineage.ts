import type { IAutoMovieCubicBezierCurve64 } from "../geometry/IAutoMovieCubicBezierCurve64";
import type {
  IAutoMovieRecoveryHermiteCurve,
  IAutoMovieRecoverySlabsInput,
} from "..";

/**
 * Acquisition owner for ordered source cuts and equality-gated saved-cubic
 * correspondence. Source bytes and stage receipts remain the existing program's
 * responsibility. Both operations return acquisition metadata and never replace
 * generated or saved skin.
 */

export namespace IAutoMovieRecoveryOrderedLineage {
  /**
   * Registered immutable mesh and complete saved-plane population for one
   * source selection. Source identities are compared opaque strings; the
   * adapter verifies actual bytes.
   */
  export interface Input extends Omit<
    IAutoMovieRecoverySlabsInput,
    "slabPairs"
  > {
    /**
     * Injective local input face ordinal to complete original native face
     * ordinal; no vertex remapping is implied.
     */
    originalTriangleIds: readonly number[];
  }

  /**
   * Explicit saved cubic and its caller-bound original numerical fit policy.
   * This operation supports the stored cubic basis only, not a reduction of
   * another degree or rational curve.
   */
  export interface Target {
    /** Original physical source plane in registered mm. */
    coordinateMm: number;

    /** Raw contour ordinal, not a fitted loop index. */
    contourIndex: number;

    /** Verified saved artifact dependency containing the target publication. */
    observationIdentity: string;

    /**
     * Unchanged saved physical-h cubic in its original Bernstein or Hermite
     * basis.
     */
    curve: IAutoMovieCubicBezierCurve64 | IAutoMovieRecoveryHermiteCurve;

    /**
     * Caller-bound actual historical fitting settings; no inference from output
     * size.
     */
    policy: {
      /** Requested source-polyline correspondence tolerance in mm. */
      toleranceMm: number;

      /** Original fitter span budget, a positive integer. */
      maxSpans: number;

      /** Declared C0-corner threshold in degrees. */
      cornerDegrees: number;

      /**
       * Actual material-side orientation convention, not inferred anatomical
       * direction.
       */
      sourceOrientationSign: 1 | -1;
    };
  }
}
