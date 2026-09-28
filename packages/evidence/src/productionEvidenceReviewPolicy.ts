import type { AutoMovieEvidenceStage } from "./createAutoMovieEvidenceConfig";

/**
 * Native companion rows are outside production evidence enforcement.
 *
 * The graph factory calls this policy for every retained lifecycle state.
 * `review` remains a compatible declaration of completed evidence, while
 * author inspection and the builder's physical review/final gates are separate
 * obligations. No stage asks for an evidenceReview or fingerprint row.
 *
 * @evidence requirements/production-evidence/graph.md#agent-production-evidence-shape-stage Keeps the compatible review declaration without adding companion-row authoring to any lifecycle state.
 * @evidence specifications/production-evidence/graph.md#spec-authoring-production-evidence-shape-stage Supplies the graph factory's stage-independent native companion policy while leaving structural references enabled.
 */
export const requiresAutoMovieEvidenceReview = (
  _stage: AutoMovieEvidenceStage,
): boolean => false;
