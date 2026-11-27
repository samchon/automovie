import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryFieldComplexCounts,
  IAutoMovieRecoveryFieldComplexPiece,
  IAutoMovieRecoveryUnsupportedDomain,
} from "..";

/**
 * Assembled coefficient authority with explicit coverage and qualification
 * limits.
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
