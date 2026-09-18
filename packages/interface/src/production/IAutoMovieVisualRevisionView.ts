import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One stable rendered observation in a named revision snapshot.
 *
 * The record deliberately carries only the identity needed to join the same
 * view across revisions and the digest a producer already verified. It is not
 * review evidence and does not prescribe how a camera or subject is produced.
 *
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-catalog-identity Exposes a stable subject-view identity inside one named visual catalog.
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-digest-reuse Carries the existing image digest without requiring another byte read or hash.
 * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Types one unique subject-view record in a revision snapshot.
 * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-digest-boundary Keeps the comparison input independent of render, decode, and filesystem operations.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualRevisionView {
  /**
   * Stable namespaced subject identity, such as a shot or compiled subject id.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-catalog-identity Identifies what the observation depicts without defining a subject hierarchy.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Forms the first half of the unique catalog key.
   */
  subject: string;
  /**
   * Stable catalog-local view identity. A different viewpoint, time, pass, or
   * presentation basis requires a different identity.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-catalog-identity Identifies which repeatable observation of the subject is being compared.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Forms the second half of the unique catalog key.
   */
  view: string;
  /**
   * Exact digest of the already-produced image bytes.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-digest-reuse Reuses the producer's byte identity instead of requesting the bytes again.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-digest-boundary Supplies the sole value compared by the pure fold.
   */
  digest: AutoMovieContentDigest;
}
