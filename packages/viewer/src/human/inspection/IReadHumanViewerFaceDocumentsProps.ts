import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * What the face documents are read from.
 *
 * @evidence contracts/common.md#principled-implementation Face catalogue reading combines an application reference, published subjects, the exact face basis and face-source authority for stable document keys.
 * @evidence contracts/common.md#clear-and-simple-design The input record leaves reference authoring with the application and source/basis identity with their respective owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader receives parameter documents rather than a bundled subject geometry file masquerading as a general face implementation.
 * @evidence contracts/common.md#meaningful-documentation Comments identify application-owned reference parameters, basis identity, subjects path and the source digest that enters keys.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This face-reader input shape implements no JSON parse or cryptographic digest algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Document keys depend on document content, face basis digest and face source digest; a matching display name alone cannot reuse a built result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The props borrow configuration and documents without acquiring file handles; the caller owns any face-document memo.
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
