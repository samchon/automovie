import {
  AutoMovieContentDigest,
  IAutoMovieSubjectReviewTarget,
} from "@automovie/interface";

/**
 * Exact current context against which verified subject observations are folded.
 *
 * Runtime identity is the canonical capture-runtime JSON, not a weaker local
 * fingerprint. Production owns its schema validation and hands the fold only a
 * receipt whose artifact, pose and runtime have already been reopened.
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
