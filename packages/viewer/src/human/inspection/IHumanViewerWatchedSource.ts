import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles.js";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";
import type { IHumanViewerSourceRevisions } from "./IHumanViewerSourceRevisions.js";

/**
 * The source owner as watching uses it: what to watch and how an edit maps to a revision.
 *
 * @evidence contracts/common.md#principled-implementation Watched inputs, published basis views and import-graph revisions identify the source boundaries an edit can invalidate.
 * @evidence contracts/common.md#clear-and-simple-design The source owner supplies paths and revision operations while the subscription owns event batching.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source reachability and published-file identities decide affected revisions rather than document-specific exceptions.
 * @evidence contracts/common.md#meaningful-documentation Names input/example files, watched paths, normalization, basis refresh and the shared revision owner.
 * @author Samchon
 */
export interface IHumanViewerWatchedSource {
  /** Directory of hand-written inputs; an edit there rereads the catalogue. */
  inputsDirectory: string;

  /** Source directories whose reached files move revisions. */
  watched: readonly string[];

  /** Published bases; an edit refreshes their digests. */
  basisFiles: IHumanViewerBasisFiles;

  /** Published person generation views; an edit rereads the catalogue. */
  generationFiles: IHumanViewerGenerationFiles;

  /** Published face subjects. */
  documentsFile: string;

  /** The generation's subject people; an edit rereads the catalogue. */
  subjectPeopleFile: string;

  /** Playground body examples; an edit rereads the catalogue. */
  bodyExamplesFile: string;

  /**
   * Normalizes a path to forward slashes.
   *
   * @evidence contracts/common.md#principled-implementation Path normalization provides forward-slash spelling used by the source revision graph.
   * @evidence contracts/common.md#clear-and-simple-design The source owner supplies one normalization operation to watcher consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Normalization does not rewrite file bytes or infer source authority from a subject name.
   * @evidence contracts/common.md#meaningful-documentation Defines the normalized path spelling returned for an input file.
   */
  slash: (file: string) => string;

  /**
   * Recomputes the published basis digests.
   *
   * @evidence contracts/common.md#principled-implementation Basis refresh recomputes the published digest authority before the edit batch is hashed.
   * @evidence contracts/common.md#clear-and-simple-design The published source owner retains basis reading and digest storage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refreshing a digest does not manufacture a valid unpublished or unreadable basis.
   * @evidence contracts/common.md#meaningful-documentation Names the publication digest refresh operation.
   */
  refreshBases: () => void;

  /** The revision owner. */
  revisions: IHumanViewerSourceRevisions;
}
