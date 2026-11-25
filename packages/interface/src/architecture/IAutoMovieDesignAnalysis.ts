import type { IAutoMovieDesignAnalysisOutcome } from "./IAutoMovieDesignAnalysisOutcome";

/**
 * One attempted reading of one frame.
 *
 * Every attempt is recorded, including the ones that produced nothing. An
 * `observed` outcome may name only candidates built from marks on {@link frame},
 * and no candidate may be claimed by two analyses.
 */
export interface IAutoMovieDesignAnalysis {
  /** Stable analysis identity, unique within the document. */
  id: string;

  /** Frame this analysis read; must name a frame of the same document. */
  frame: string;

  /** Non-blank open label of the reading attempted, such as `wall-centerline`. */
  subject: string;

  /**
   * What the attempt produced: candidates when it ran, or the reason it did
   * not, so an absent reading is never mistaken for a clean sheet.
   */
  outcome: IAutoMovieDesignAnalysisOutcome;
}
