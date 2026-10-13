import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";

/**
 * What the standard body states are built from.
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
