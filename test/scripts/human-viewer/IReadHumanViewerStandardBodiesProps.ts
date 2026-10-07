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

  /** Source digests; body and companion-source consumers enter the paired body's keys. */
  sources: IHumanViewerRevisions;
}
