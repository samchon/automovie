import type { IHumanViewerBasisFiles } from "./IHumanViewerBasisFiles.js";
import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";
import type { IHumanViewerSourceRevisions } from "./IHumanViewerSourceRevisions.js";

/**
 * The source owner as watching uses it: what to watch and how an edit maps to a revision.
 *
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

  /** Normalizes a path to forward slashes. */
  slash: (file: string) => string;

  /** Recomputes the published basis digests. */
  refreshBases: () => void;

  /** The revision owner. */
  revisions: IHumanViewerSourceRevisions;
}
