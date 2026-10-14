import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";
import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * What the standard people are built from.
 *
 * @evidence contracts/common.md#principled-implementation Standard-person composition receives a reference face and application body parameters tied to one usable published generation.
 * @evidence contracts/common.md#clear-and-simple-design Face reference, body examples, paired generation authority and numerical source identities stay explicit at the application-factory boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The contract supplies parameter documents rather than finished named geometry; actual person admission remains with the numerical owner.
 * @evidence contracts/common.md#meaningful-documentation Comments describe the reference face, published pair, all-three-domain key inputs and application-owned body parameter sets.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This person-example input record selects no assembly or face/body construction algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Person keys require the composed document, both generation view digests and face/body/person source digests; an equal example name is insufficient.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This factory input borrows reference and example data without owning constructed resident resources.
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
