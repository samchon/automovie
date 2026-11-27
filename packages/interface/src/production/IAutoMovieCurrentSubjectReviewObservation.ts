import type { IAutoMovieSubjectReviewCurrentContext } from "./IAutoMovieSubjectReviewCurrentContext";
import type { IAutoMovieSubjectReviewObservation } from "./IAutoMovieSubjectReviewObservation";

/**
 * Production-verified observation admitted at the engine boundary.
 *
 * The production verifier creates this projection only after checking the exact
 * persisted schema, pose, owned artifact bytes and terminal verdict. It is the
 * persisted observation plus the context it was verified against; the only
 * member the context adds is `captureRuntimeIdentity`, and the shared members
 * (`productionId`, `target`, `revision`, `compileFingerprint`, `planIdentity`)
 * carry one type in both.
 *
 * `foldSubjectReviewCoverage` receives these typed records and counts
 * one only when its identities are non-blank and its target names the same
 * subject; the compiler owns the record's shape.
 */
export type IAutoMovieCurrentSubjectReviewObservation =
  IAutoMovieSubjectReviewObservation & IAutoMovieSubjectReviewCurrentContext;
