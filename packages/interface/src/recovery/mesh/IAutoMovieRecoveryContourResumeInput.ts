import type {
  IAutoMovieRecoveryContourResumePolicy,
  IAutoMovieRecoverySlabsInput,
} from "../../index";

/**
 * Resume explicitly failed source contours without loading saved coefficients.
 * All saved raw populations are rebound before fitting. The caller verifies
 * original bytes, registration, source selection, original triangle ordering
 * and actual artifact policy. Successful, unresolved-tolerance, open and
 * degenerate publications are not failed targets and cannot be refitted here.
 */
export interface IAutoMovieRecoveryContourResumeInput extends Omit<
  IAutoMovieRecoverySlabsInput,
  "slabPairs"
> {
  /**
   * One caller-attested original policy for each distinct targeted artifact
   * identity; duplicate and unused policies refuse.
   */
  fitPolicies: readonly IAutoMovieRecoveryContourResumePolicy[];

  /**
   * Nonempty distinct failed raw addresses, in requested patch order.
   * Coordinates use signed millimetres along the normalized frame n;
   * contourIndex is the original raw cutter ordinal, never a saved loop/report
   * or new patch index.
   */
  targets: readonly {
    /**
     * Signed section-plane coordinate along the registered unit sweep axis, in
     * millimetres.
     */
    coordinateMm: number;
    /**
     * Raw contour ordinal within its physical plane, before fitting or
     * rejection.
     */
    contourIndex: number;
  }[];
}
