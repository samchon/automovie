import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * What the generation subject people are read from.
 *
 * @evidence contracts/common.md#principled-implementation Subject-people parsing receives exact file text plus the selected published generation and source authorities that each person key must match.
 * @evidence contracts/common.md#clear-and-simple-design The repository-relative file label serves refusal context while generation identity and content remain separate numerical authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts People must name the selected generation's bases rather than being reassigned silently to a convenient fallback generation.
 * @evidence contracts/common.md#meaningful-documentation Members document source text, refusal-path label, required generation and face/body/person source digests entering keys.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Generation-subject input metadata chooses no schema validation or person-key hashing algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Person reuse depends on full document, head/body byte digests and all three numerical source digests supplied here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parser receives borrowed text and metadata without retaining a source stream or generation worker handle.
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
