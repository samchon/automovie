import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";

/**
 * What the face documents are read from.
 *
 * @author Samchon
 */
export interface IReadHumanViewerFaceDocumentsProps {
  /**
   * Reference parameter document authored by the application on the supplied face basis.
   */
  reference: IHumanViewerReferenceFaceDocument;

  /** The published face basis. */
  face: IHumanViewerBasisIdentity;

  /** The published subjects file. */
  documentsFile: string;

  /** Source digests; the face digest enters the keys. */
  sources: IHumanViewerRevisions;
}
