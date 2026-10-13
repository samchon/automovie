/**
 * What the catalogue needs of the published person generation to build the
 * standard people on it: the view basis ids their documents name and the
 * digests of both view files for their cache keys.
 *
 * @evidence contracts/common.md#principled-implementation Names the basis ids read from the views themselves and keys the people by both files' bytes.
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#clear-and-simple-design Paired view ids and both byte digests are the minimal facts needed to construct and key standard people.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching generation names alone cannot substitute for both selected view files' content witnesses.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Names the basis ids read from the views themselves and keys the people by both files' bytes.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Matching generation names alone cannot substitute for both selected view files' content witnesses.
 *
 * @author Samchon
 */
export interface IHumanViewerPublishedGeneration {
  /**
   * `face.id` of the head view, the face basis the standard people name.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Uses the actual head view's Face basis id when constructing standard people.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Uses the actual head view's Face basis id when constructing standard people.
   */
  face: string;

  /**
   * `body.id` of the body view, the body basis the standard people name.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Uses the paired Body view's basis id from that same selected generation.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Uses the paired Body view's basis id from that same selected generation.
   */
  body: string;

  /**
   * Hex SHA-256 of the head view file.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Includes exact selected head-view bytes in Person cache authority.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Includes exact selected head-view bytes in Person cache authority.
   */
  headDigest: string;

  /**
   * Hex SHA-256 of the body view file.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Includes exact selected Body-view bytes alongside the head digest instead of trusting generation labels alone.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Includes exact selected Body-view bytes alongside the head digest instead of trusting generation labels alone.
   */
  bodyDigest: string;
}
