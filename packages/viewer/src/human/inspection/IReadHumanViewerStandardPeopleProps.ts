import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";

/**
 * What the standard people are built from.
 *
 * @author Samchon
 */
export interface IReadHumanViewerStandardPeopleProps {
  /** The reference face the standard people wear. */
  reference: IHumanViewerReferenceFaceDocument;

  /** The usable published person generation. */
  generation: IHumanViewerPublishedGeneration;

  /** Source digests; all three enter a person key. */
  sources: IHumanViewerRevisions;

  /** Application-owned body parameter sets composed with the reference face. */
  examples: HumanViewerBodyExamples;
}
