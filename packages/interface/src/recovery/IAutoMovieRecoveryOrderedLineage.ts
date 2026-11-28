import type {
  IAutoMovieRecoveryHermiteCurve,
  IAutoMovieRecoverySlabsInput,
} from "..";
import type { IAutoMovieCubicBezierCurve64 } from "../geometry/IAutoMovieCubicBezierCurve64";

/**
 * Input and target contracts for ordered source recuts and equality-gated saved
 * cubic replay.
 */

export namespace IAutoMovieRecoveryOrderedLineage {
  /**
   * Supply an immutable selected mesh, complete saved-plane records and a
   * caller-verified native face mapping.
   */
  export interface Input extends Omit<
    IAutoMovieRecoverySlabsInput,
    "slabPairs"
  > {
    /**
     * Complete injective local-triangle-to-native-triangle ordinal map. Supply
     * nonnegative safe integers in local input order.
     */
    originalTriangleIds: readonly number[];
  }

  /**
   * Select one saved cubic publication and the numerical policy used for its
   * replay.
   */
  export interface Target {
    /** Signed registered station of the saved fit in millimetres. */
    coordinateMm: number;

    /** Original raw contour ordinal at the saved station. */
    contourIndex: number;

    /** Verified label of the saved section artifact containing this publication. */
    observationIdentity: string;

    /** Original saved physical-width cubic in Bernstein or Hermite form. */
    curve: IAutoMovieCubicBezierCurve64 | IAutoMovieRecoveryHermiteCurve;

    /**
     * Caller-attested original fitting tolerance, span cap, corner angle and
     * material side sign.
     */
    policy: {
      /**
       * Caller-attested original physical correspondence tolerance in
       * millimetres.
       */
      toleranceMm: number;

      /** Caller-attested original positive curve span cap. */
      maxSpans: number;

      /** Caller-attested original corner classification threshold in degrees. */
      cornerDegrees: number;

      /** Caller-attested material side sign used to replay contour winding. */
      sourceOrientationSign: 1 | -1;
    };
  }
}
