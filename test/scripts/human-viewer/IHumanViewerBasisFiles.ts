/**
 * Paths of the published connected bases the viewer serves and builds on.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the basis file of each domain.
 * @author Samchon
 */
export interface IHumanViewerBasisFiles {
  /** Published face basis, gzip JSON. */
  face: string;

  /** Published body basis, gzip JSON. */
  body: string;
}
