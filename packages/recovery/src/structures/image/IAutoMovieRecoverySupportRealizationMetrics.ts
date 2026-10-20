import type { IAutoMovieRecoverySupportGeneration } from "./IAutoMovieRecoverySupportGeneration";

/**
 * Convex-support generation counts with a face chord bound and numerical event qualification.
 *
 * @evidence contracts/common.md#principled-implementation Support event and mesh counts are supplemented by a face-chord bound and the numerical event qualification.
 * @evidence contracts/common.md#clear-and-simple-design The face approximation bound remains distinct from the support boundary discrepancy inherited by this report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Binary64 event qualification is numerical evidence rather than a certified event or source-surface bound.
 * @evidence contracts/common.md#meaningful-documentation States metre units and distinguishes face approximation from uncertified event arithmetic.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoverySupportRealizationMetrics extends IAutoMovieRecoverySupportGeneration {
  /** Numerical face chord bound, metres. */
  faceChordBoundMeters: number;

  /** Scope of the binary64 event calculation, without certification. */
  eventQualification: "binary64-numerical-not-certified";
}
