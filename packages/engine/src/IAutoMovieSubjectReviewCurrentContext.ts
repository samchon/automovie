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
 *
 * `foldAutoMovieSubjectReviewCoverage` throws when the context does not name the
 * resolved unit: a blank production id, shot or runtime identity, a target or
 * revision differing from the unit, or a digest not in `sha256:` hex form. An
 * observation is current only when its revision, compile fingerprint, plan
 * identity and runtime JSON equal these strings exactly.
 *
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
