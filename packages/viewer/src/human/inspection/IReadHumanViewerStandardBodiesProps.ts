import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";

/**
 * What the standard body states are built from.
 *
 * @evidence contracts/common.md#principled-implementation Standard body keys use the published generation and their actual body/companion dependency revisions.
 * @evidence contracts/common.md#clear-and-simple-design Application example parameters remain explicit data beside numerical generation and source authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Examples supply authoring values without moving their catalogue content into the numerical builder.
 * @evidence contracts/common.md#meaningful-documentation Explains usable generation, paired-body source keys and application-owned body parameter sets.
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
