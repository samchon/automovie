import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";

/**
 * What the face documents are read from.
 *
 * @evidence contracts/common.md#principled-implementation Face document keys read the published face identity and the source revisions supplied to the reader.
 * @evidence contracts/common.md#clear-and-simple-design One input record separates face basis authority from the subjects-file path and dependency authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader's inputs identify the actual basis and source instead of embedding named-person geometry.
 * @evidence contracts/common.md#meaningful-documentation Documents the published face basis, subjects path and face revision used in document keys.
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
