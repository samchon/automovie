import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * What the generation subject people are read from.
 *
 * @author Samchon
 */
export interface IReadHumanViewerGenerationSubjectsProps {
  /** The subject people file's bytes as text. */
  text: string;

  /** The file's path relative to the repository, for refusal reasons. */
  file: string;

  /** The published generation the people must name. */
  generation: IHumanViewerPublishedGeneration;

  /** Source digests; all three enter a person key. */
  sources: IHumanViewerRevisions;
}
