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
 * @evidence contracts/common.md#principled-implementation An intersection of the persisted observation and the verification context, the TypeScript idiom for a record that satisfies both shapes; it relies on the shared members having identical types, which both declarations keep.
 * @evidence contracts/common.md#clear-and-simple-design Composes the two owning declarations instead of restating `target` and `verdict`, so each member has one declaration and the engine's coverage fold reads one projection that production builds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Trust is not encoded in the type: the fold re-checks each `unknown` record with a structural guard instead of casting, and no producer or fixture is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States who creates the projection and after which checks, which member the context adds over the observation, and every field the fold's guard verifies before counting a record.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type alias with no code; checking a record costs the fold's constant-time guard per observation, answered on `foldAutoMovieSubjectReviewCoverage`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Describes one verified receipt; no operation on this type shares work, and production rebuilds the projection from the reopened artifact on every verification.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds strings and references its nested pose and runtime records; the caller's observation list owns all of them, and the type keeps no handle.
 * @author Samchon
 */
export type IAutoMovieCurrentSubjectReviewObservation =
  IAutoMovieSubjectReviewObservation & IAutoMovieSubjectReviewCurrentContext;
