import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions";

/**
 * What the generation subject people are read from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
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
