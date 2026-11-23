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
 * The engine does not trust the type: `foldAutoMovieSubjectReviewCoverage`
 * receives `unknown` records and counts one only after a structural guard finds
 * the `subject-view` kind, non-blank identities, `pose` and `runtimeIdentity`
 * objects, `verdict: "passed"`, `deliveryEvidence: false` and a target naming
 * the same subject.
 */
export type IAutoMovieCurrentSubjectReviewObservation =
  IAutoMovieSubjectReviewObservation & IAutoMovieSubjectReviewCurrentContext;
