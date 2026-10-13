import type { AutoMovieEvidenceStage } from "./createAutoMovieEvidenceConfig";

/**
 * Native companion rows are outside production evidence enforcement.
 *
 * The graph factory calls this policy for every retained lifecycle state.
 * `review` remains a compatible declaration of completed evidence, while
 * author inspection and the builder's physical review/final gates are separate
 * obligations. No stage asks for an evidenceReview or fingerprint row.
 */
export const requiresAutoMovieEvidenceReview = (
  _stage: AutoMovieEvidenceStage,
): boolean => false;
