import { AutoMovieContentDigest, IAutoMovieSubjectReviewTarget } from "@automovie/interface";

/**
 * Exact current context against which verified subject observations are folded.
 *
 * Runtime identity is the canonical capture-runtime JSON, not a weaker local
 * fingerprint. Production owns its schema validation and hands the fold only a
 * receipt whose artifact, pose and runtime have already been reopened.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-evidence Binds coverage to the production, target, compile, plan and current runtime that produced the reopened artifact.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-freshness Makes every changed current-context member stale rather than silently current.
 */
export interface IAutoMovieSubjectReviewCurrentContext {
  /** Production namespace that owns the inspection. */
  productionId: string;
  /** Exact artifact-qualified subject target. */
  target: IAutoMovieSubjectReviewTarget;
  /** Exact compiled subject revision. */
  revision: string;
  /** Current source compile identity. */
  compileFingerprint: AutoMovieContentDigest;
  /** Canonical ordered whole-plan identity. */
  planIdentity: AutoMovieContentDigest;
  /** Canonical complete capture-runtime identity JSON. */
  captureRuntimeIdentity: string;
}
