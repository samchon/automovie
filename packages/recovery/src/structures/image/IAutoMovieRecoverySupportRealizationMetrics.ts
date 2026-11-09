import type { IAutoMovieRecoverySupportGeneration } from "./IAutoMovieRecoverySupportGeneration";

/**
 * Convex-support generation counts with a face chord bound and numerical event qualification.
 *
 * @evidence contracts/development/design.md#principled-representation Support event and mesh counts are supplemented by a face-chord bound and the numerical event qualification.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face approximation bound remains distinct from the support boundary discrepancy inherited by this report.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Binary64 event qualification is numerical evidence rather than a certified event or source-surface bound.
 * @evidence contracts/development/common.md#meaningful-documentation States metre units and distinguishes face approximation from uncertified event arithmetic.
 */
export interface IAutoMovieRecoverySupportRealizationMetrics extends IAutoMovieRecoverySupportGeneration {
  /** Numerical face chord bound, metres. */
  faceChordBoundMeters: number;

  /** Scope of the binary64 event calculation, without certification. */
  eventQualification: "binary64-numerical-not-certified";
}
