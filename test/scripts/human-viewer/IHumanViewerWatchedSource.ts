import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles";
import type { IHumanViewerSourceRevisions } from "./IHumanViewerSourceRevisions";

/**
 * The source owner as watching uses it: what to watch and how an edit maps to
 * a revision.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every watched input and operation.
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

  /** Normalizes a path to forward slashes. */
  slash: (file: string) => string;

  /** Recomputes the published basis digests. */
  refreshBases: () => void;

  /** The revision owner. */
  revisions: IHumanViewerSourceRevisions;
}
