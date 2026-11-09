import { IAutoMovieSubjectReviewTarget } from "@automovie/interface";

/**
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
 * identity and runtime JSON equal these strings exactly; one naming another
 * production, shot or subject is counted as foreign.
 *
 * @evidence contracts/development/design.md#principled-representation Currency is decided by exact string equality over the revision, the two `sha256:` digests and the canonical runtime JSON, which is sound because production canonicalizes the runtime JSON before both sides are written, so equal runtimes give equal strings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Six flat members, each a join key the fold compares directly; schema validation of the runtime stays with production, so the engine holds only the identities it compares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the full canonical runtime JSON rather than a weaker local fingerprint, and the fold throws on a context that does not name the resolved unit instead of silently treating every observation as stale.
 * @evidence contracts/development/common.md#meaningful-documentation States the throw conditions the fold applies to the context, the four strings an observation must equal to be current, the `sha256:` form of both digests, and the non-blank requirement on each identity.
 */
export interface IAutoMovieSubjectReviewCurrentContext {
  /** Production namespace that owns the inspection; non-blank. */
  productionId: string;

  /** Exact artifact-qualified subject target; must equal the resolved unit's. */
  target: IAutoMovieSubjectReviewTarget;

  /** Exact compiled subject revision; must equal the resolved unit's. */
  revision: string;

  /** Current source compile identity, a `sha256:` hex digest. */
  compileFingerprint: string;

  /** Canonical ordered whole-plan identity, a `sha256:` hex digest. */
  planIdentity: string;

  /** Canonical complete capture-runtime identity JSON; non-blank. */
  captureRuntimeIdentity: string;
}
