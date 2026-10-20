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
 * @evidence contracts/common.md#principled-implementation Currency is decided by exact string equality over the revision, the two `sha256:` digests and the canonical runtime JSON, which is sound because production canonicalizes the runtime JSON before both sides are written, so equal runtimes give equal strings.
 * @evidence contracts/common.md#clear-and-simple-design Six flat members, each a join key the fold compares directly; schema validation of the runtime stays with production, so the engine holds only the identities it compares.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the full canonical runtime JSON rather than a weaker local fingerprint, and the fold throws on a context that does not name the resolved unit instead of silently treating every observation as stale.
 * @evidence contracts/common.md#meaningful-documentation States the throw conditions the fold applies to the context, the four strings an observation must equal to be current, the `sha256:` form of both digests, and the non-blank requirement on each identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Carries values only; the fold validates it once per call with two regex tests and compares it per observation in constant time.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Passed by the caller for one fold; the type defines no operation, and no result keyed by this context is stored for a later fold.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Six strings and one target record owned by the caller for the duration of one fold; nothing grows with the number of observations.
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
