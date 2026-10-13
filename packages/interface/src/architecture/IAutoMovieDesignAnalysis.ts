import { IAutoMovieDesignAnalysisOutcome } from "./IAutoMovieDesignAnalysisOutcome";

/**
 * One attempted reading of one frame.
 *
 * Every attempt is recorded, including the ones that produced nothing. An
 * `observed` outcome may name only candidates built from marks on
 * {@link frame}, and no candidate may be claimed by two analyses.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignAnalysis {
  /** Stable analysis identity within the document. */
  id: string;

  /** Frame this analysis read; must name a frame of the same document. */
  frame: string;

  /** Open label of the reading attempted, such as `wall-centerline`. */
  subject: string;

  /** Honest outcome of the attempt. */
  outcome: IAutoMovieDesignAnalysisOutcome;
}
