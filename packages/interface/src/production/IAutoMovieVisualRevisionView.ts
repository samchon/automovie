
/**
 * One stable rendered observation in a named revision snapshot.
 *
 * Stable subject/view identity joins the supplied image digest across revisions; this record carries no review verdict or proof that the digest was reopened from resident bytes.
 *
 * @evidence contracts/common.md#principled-implementation Visual comparison uses the exact subject/view tuple and supplied SHA-256 image-byte digest, requiring a different view identity when camera, time, pass or presentation basis changes.
 * @evidence contracts/common.md#clear-and-simple-design Three fields support existing-image progress comparison without coupling the catalog to a renderer, capture host or structural subject representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest equality is byte identity of supplied claims, not a perceptual score or evidence that a review passed; the comparison does not reopen images or verify producer provenance.
 * @evidence contracts/common.md#meaningful-documentation Defines namespaced subject and catalog-local view ownership, identity changes across presentation basis and exact image digest meaning.
 * @author Samchon
 */
export interface IAutoMovieVisualRevisionView {
  /**
   * Stable namespaced subject identity, such as a shot or compiled subject id.
   */
  subject: string;

  /**
   * Stable catalog-local view identity. A different viewpoint, time, pass, or presentation basis requires a different identity.
   */
  view: string;

  /** Exact digest of the already-produced image bytes. */
  digest: string;
}
