import type { IAutoMovieRecoveryObservedInteriorPoint } from "../structures/observation/IAutoMovieRecoveryObservedInteriorPoint";
import type { IAutoMovieRecoveryObservedPoint } from "../structures/observation/IAutoMovieRecoveryObservedPoint";

/**
 * Closed point-origin choices for a transported geometric observation chart.
 *
 * @evidence contracts/common.md#principled-implementation Distinct kind literals preserve observed-point identity versus strict PL-edge interpolation.
 * @evidence contracts/common.md#clear-and-simple-design Two named records define the complete existing provenance union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unqualified material correspondence or invented observation arm is admitted.
 * @evidence contracts/common.md#meaningful-documentation Names both origins and leaves their addresses and fractions with the corresponding record.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased union performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union acquires no resources.
 */
export type AutoMovieRecoveryObservationProvenance =
  | IAutoMovieRecoveryObservedPoint
  | IAutoMovieRecoveryObservedInteriorPoint;
