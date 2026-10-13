import { IAutoMovieDesignAnalysisOutcome } from "./IAutoMovieDesignAnalysisOutcome";

/**
 * One attempted reading of one frame.
 *
 * Every attempt is recorded, including the ones that produced nothing. An
 * `observed` outcome may name only candidates built from marks on
 * {@link frame}, and no candidate may be claimed by two analyses.
 *
 * @evidence contracts/common.md#principled-implementation Provenance is a one-frame binding: `validateDesignReference` checks each observed candidate's source marks against the analysed frame and records which analysis claimed it, so every reading traces to exactly one attempt on one sheet.
 * @evidence contracts/common.md#clear-and-simple-design The attempt names its frame and label and delegates what it produced to the outcome union, so the observed, unsupported, and not-run cases need no optional fields here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A candidate built from marks on another frame, or claimed by a second analysis, is refused by name instead of being re-attributed, and cross-sheet correlation is left to authored evidence.
 * @evidence contracts/common.md#meaningful-documentation States that failed attempts are recorded too, the one-frame and one-claimant rules for candidates, the id's uniqueness scope, that the frame must resolve in the same document, and that the label is non-blank.
 * @author Samchon
 */
export interface IAutoMovieDesignAnalysis {
  /** Stable analysis identity, unique within the document. */
  id: string;

  /** Frame this analysis read; must name a frame of the same document. */
  frame: string;

  /**
   * Non-blank open label of the reading attempted, such as
   * `wall-centerline`.
   */
  subject: string;

  /**
   * What the attempt produced: candidates when it ran, or the reason it did
   * not, so an absent reading is never mistaken for a clean sheet.
   */
  outcome: IAutoMovieDesignAnalysisOutcome;
}
