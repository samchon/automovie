import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions";

/**
 * What the standard people are built from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 * @author Samchon
 */
export interface IReadHumanViewerStandardPeopleProps {
  /** The reference face the standard people wear. */
  reference: IHumanViewerReferenceFaceDocument;

  /** The usable published person generation. */
  generation: IHumanViewerPublishedGeneration;

  /** Source digests; all three enter a person key. */
  sources: IHumanViewerRevisions;
}
