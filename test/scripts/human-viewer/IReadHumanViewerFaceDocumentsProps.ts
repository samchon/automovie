import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions";

/**
 * What the face documents are read from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 * @author Samchon
 */
export interface IReadHumanViewerFaceDocumentsProps {
  /** The published face basis. */
  face: IHumanViewerBasisIdentity;

  /** The published subjects file. */
  documentsFile: string;

  /** Source digests; the face digest enters the keys. */
  sources: IHumanViewerRevisions;
}
