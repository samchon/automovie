import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";

/**
 * What the standard body states are built from.
 *
 * @evidence contracts/common.md#principled-implementation Standard body states use application parameters on the published generation's body basis with companion head authority preserved in their keys.
 * @evidence contracts/common.md#clear-and-simple-design Generation metadata, source authority and example parameters remain separate inputs to catalogue document composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical builders receive application-owned shape/pose values unchanged; no named preset geometry is stored in this type.
 * @evidence contracts/common.md#meaningful-documentation Members identify the usable generation, companion-source key dependencies and external ownership of example parameter sets.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This body-example input shape chooses no mesh construction or catalogue mapping algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Body entry keys include full parameter documents, both view byte digests and body/person source digests before numerical results can be reused.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed example parameters and generation metadata own no numerical worker, basis-byte buffer or GPU resource.
 *
 * @author Samchon
 */
export interface IReadHumanViewerStandardBodiesProps {
  /** The usable published person generation. */
  generation: IHumanViewerPublishedGeneration;

  /**
   * Source digests; body and companion-source consumers enter the paired body's keys.
   */
  sources: IHumanViewerRevisions;

  /**
   * Parameter sets supplied by the application, independent of the numerical builder.
   */
  examples: HumanViewerBodyExamples;
}
