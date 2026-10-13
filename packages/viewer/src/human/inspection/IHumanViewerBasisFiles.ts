/**
 * Paths of the published connected bases the viewer serves and builds on.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the basis file of each domain.
 *
 * @evidence contracts/common.md#principled-implementation Face and body paths identify the compressed bases consumed by the same domain workers.
 * @evidence contracts/common.md#clear-and-simple-design Only the two published domain files are carried; basis interpretation remains with Human.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paths are supplied by the source owner rather than inferred from a subject's appearance.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Face and body paths identify the compressed bases consumed by the same domain workers.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Paths are supplied by the source owner rather than inferred from a subject's appearance.
 *
 * @author Samchon
 */
export interface IHumanViewerBasisFiles {
  /**
   * Published face basis, gzip JSON.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Selects the actual compressed Face basis consumed by the same Face owner and digest computation.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Selects the actual compressed Face basis consumed by the same Face owner and digest computation.
   */
  face: string;

  /**
   * Published body basis, gzip JSON.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Selects the actual compressed Body basis consumed by the same Body owner and digest computation.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Selects the actual compressed Body basis consumed by the same Body owner and digest computation.
   */
  body: string;
}
