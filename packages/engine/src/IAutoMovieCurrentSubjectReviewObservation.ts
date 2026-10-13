import {
  IAutoMovieSubjectReviewObservation,
  IAutoMovieSubjectReviewTarget,
} from "@automovie/interface";

import { IAutoMovieSubjectReviewCurrentContext } from "./IAutoMovieSubjectReviewCurrentContext";

/**
 *
 * Production-verified observation admitted at the engine boundary.
 *
 * The production verifier creates this projection only after checking the
 * exact persisted schema, pose, owned artifact bytes and terminal verdict.
 *
 * The engine does not trust the type: `foldAutoMovieSubjectReviewCoverage`
 * receives `unknown` records and counts one only after a structural guard finds
 * the `subject-view` kind, non-blank identities, `verdict: "passed"`,
 * `deliveryEvidence: false` and a target naming the same subject. `target` and
 * `verdict` restate members the base observation already declares with the
 * same types; the member the context adds is `captureRuntimeIdentity`.
 *
 * @evidence contracts/common.md#principled-implementation Extends both the persisted receipt and the current context, so one record carries each side of the equality join (revision, compile fingerprint, plan identity, runtime JSON) the coverage fold compares.
 * @evidence contracts/common.md#clear-and-simple-design Redeclares `target` and `verdict` with the types `IAutoMovieSubjectReviewObservation` already gives them, so the redeclarations narrow nothing and the only member the context contributes is `captureRuntimeIdentity`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no flag the fold accepts on trust; the engine re-checks every field structurally on `unknown` input, and production's `verifyAutoMovieSubjectInspectionObservation` builds it only after reopening the artifact bytes.
 * @evidence contracts/common.md#meaningful-documentation States who creates the projection, what production checks first, that the fold re-validates it from `unknown`, and which members are redundant restatements.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record type; the fold's guard spends constant work per receipt on it, independent of plan size. Each projection answers one receipt against one current context and is consumed by a single coverage fold. Holds strings plus pose and runtime-identity records owned by the observation list the caller passes; it owns no handle.
 * @author Samchon
 */
export interface IAutoMovieCurrentSubjectReviewObservation
  extends
    IAutoMovieSubjectReviewObservation,
    IAutoMovieSubjectReviewCurrentContext {
  /** Exact target repeated on the receipt for an independent context join. */
  target: IAutoMovieSubjectReviewTarget;

  /** Only a terminal pass can enter the coverage numerator. */
  verdict: "passed";
}
