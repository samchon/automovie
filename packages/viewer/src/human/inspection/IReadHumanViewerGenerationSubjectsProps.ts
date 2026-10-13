import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * What the generation subject people are read from.
 *
 * @evidence contracts/common.md#principled-implementation Generation subject text is paired with its originating path, published generation and whole-person dependency revisions.
 * @evidence contracts/common.md#clear-and-simple-design The reader receives already-read text while the host retains filesystem access and publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Subject people must retain their declared published generation rather than silently use separate face/body bases.
 * @evidence contracts/common.md#meaningful-documentation Defines original text, refusal-path context, generation identity and the three person-key revision inputs.
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
