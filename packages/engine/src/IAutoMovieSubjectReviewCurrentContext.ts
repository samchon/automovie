import {
  AutoMovieContentDigest,
  IAutoMovieSubjectReviewTarget,
} from "@automovie/interface";

/**
 *
 * Exact current context against which verified subject observations are folded.
 *
 * Runtime identity is the canonical capture-runtime JSON, not a weaker local
 * fingerprint. Production owns its schema validation and hands the fold only a
 * receipt whose artifact, pose and runtime have already been reopened.
 *
 * `foldAutoMovieSubjectReviewCoverage` throws when the context does not name the
 * resolved unit: a blank production id, shot or runtime identity, a target or
 * revision differing from the unit, or a digest not in `sha256:` hex form. An
 * observation is current only when its revision, compile fingerprint, plan
 * identity and runtime JSON equal these strings exactly.
 *
 * @evidence contracts/common.md#principled-implementation Currency is exact string equality on canonical values (a revision, two `sha256:` digests, canonical runtime JSON), so a receipt counts only when every input that shaped its pixels is unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Six fields, each a join key or scope check of the fold; production computes and validates them, and the engine only compares.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the full canonical runtime JSON instead of a shortened fingerprint, so no lossy key can make two runtimes compare equal; the fold's shape checks are the only validation the engine adds.
 * @evidence contracts/common.md#meaningful-documentation States which fields the fold validates and how, the throw on a mismatch with the unit, and the exact equality that makes an observation current.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record of strings; the fold compares four of them per receipt in constant time. One context answers one fold for one unit, and the engine does not keep it between folds. Holds strings and a target owned by the fold's caller, including one canonical runtime JSON whose length grows with the runtime description.
 * @author Samchon
 */
export interface IAutoMovieSubjectReviewCurrentContext {
  /** Production namespace that owns the inspection; non-blank. */
  productionId: string;

  /** Exact artifact-qualified subject target; must equal the resolved unit's. */
  target: IAutoMovieSubjectReviewTarget;

  /** Exact compiled subject revision; must equal the resolved unit's. */
  revision: string;

  /** Current source compile identity, a `sha256:` hex digest. */
  compileFingerprint: AutoMovieContentDigest;

  /** Canonical ordered whole-plan identity, a `sha256:` hex digest. */
  planIdentity: AutoMovieContentDigest;

  /** Canonical complete capture-runtime identity JSON; non-blank. */
  captureRuntimeIdentity: string;
}
