import { IAutoMovieSubjectReviewObservation } from "@automovie/interface";

import { IAutoMovieSubjectReviewCurrentContext } from "./IAutoMovieSubjectReviewCurrentContext";

/**
 * Production-verified observation admitted at the engine boundary.
 *
 * The production verifier creates this projection only after checking the
 * exact persisted schema, pose, owned artifact bytes and terminal verdict. It is
 * the persisted observation plus the context it was verified against; the only
 * member the context adds is `captureRuntimeIdentity`, and the shared members
 * (`productionId`, `target`, `revision`, `compileFingerprint`, `planIdentity`)
 * carry one type in both.
 *
 * The engine does not trust the type: `foldAutoMovieSubjectReviewCoverage`
 * receives `unknown` records and counts one only after a structural guard finds
 * the `subject-view` kind, non-blank identities, `pose` and `runtimeIdentity`
 * objects, `verdict: "passed"`, `deliveryEvidence: false` and a target naming
 * the same subject.
 *
 * @evidence contracts/development/design.md#principled-representation An intersection of the persisted observation and the verification context, the TypeScript idiom for a record that satisfies both shapes; it relies on the shared members having identical types, which both declarations keep.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Composes the two owning declarations instead of restating `target` and `verdict`, so each member has one declaration and the engine's coverage fold reads one projection that production builds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Trust is not encoded in the type: the fold re-checks each `unknown` record with a structural guard instead of casting, and no producer or fixture is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation States who creates the projection and after which checks, which member the context adds over the observation, and every field the fold's guard verifies before counting a record.
 */
export type IAutoMovieCurrentSubjectReviewObservation =
  IAutoMovieSubjectReviewObservation & IAutoMovieSubjectReviewCurrentContext;
