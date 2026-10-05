import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions";

/**
 * What the standard body states are built from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 * @author Samchon
 */
export interface IReadHumanViewerStandardBodiesProps {
  /** The usable published person generation. */
  generation: IHumanViewerPublishedGeneration;

  /** Source digests; the body digest enters the keys. */
  sources: IHumanViewerRevisions;
}
