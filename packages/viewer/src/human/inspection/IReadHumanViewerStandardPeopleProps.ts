import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";

/**
 * What the standard people are built from.
 *
 * @evidence contracts/common.md#principled-implementation Standard people combine one reference face and admitted generation with all face/body/person source digests.
 * @evidence contracts/common.md#clear-and-simple-design The input record separates the reference face, generation authority and application-owned body examples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The composed person's keys do not substitute a single domain revision for their three actual source dependencies.
 * @evidence contracts/common.md#meaningful-documentation Documents the reference face, published generation, full person revision inputs and body example ownership.
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
