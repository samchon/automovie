/**
 * Paths of the published connected bases the viewer serves and builds on.
 *
 * @author Samchon
 */
export interface IHumanViewerBasisFiles {
  /** Published face basis, gzip JSON. */
  face: string;

  /** Published body basis, gzip JSON. */
  body: string;
}
