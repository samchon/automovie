import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";

import type { IAutoMovieRecoveryFieldComplexCounts } from "./IAutoMovieRecoveryFieldComplexCounts";
import type { IAutoMovieRecoveryFieldComplexPiece } from "./IAutoMovieRecoveryFieldComplexPiece";
import type { IAutoMovieRecoveryUnsupportedDomain } from "./IAutoMovieRecoveryUnsupportedDomain";

/**
 * Assembled coefficient authority with explicit coverage and qualification limits.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/common.md#clear-and-simple-design One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and acquire no external resources.
 */
export interface IAutoMovieRecoveryFieldComplex {
  /** Final shared coefficient atlas in model metres. */
  recipe: IAutoMovieBicubicAtlasGeometry;

  /** Retained patch provenance including owning chart. */
  sourcePieces: IAutoMovieRecoveryFieldComplexPiece[];

  /** Omitted domains and their original textual causes. */
  unsupported: IAutoMovieRecoveryUnsupportedDomain[];

  /** Actual requested, retained and shared populations. */
  counts: IAutoMovieRecoveryFieldComplexCounts;

  /** True only when no domain was omitted and observations were complete. */
  coverageComplete: boolean;

  /** Original producer observation completion. */
  observationComplete: boolean;

  /** Assembly does not qualify source-interior fidelity. */
  sourceFitQualified: false;

  /** Assembly does not qualify geometric embedding. */
  embeddingQualified: false;

  /** The result contains no original skin topology. */
  sourceTopologyPublic: false;
}
