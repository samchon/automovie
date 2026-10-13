import { IAutoMovieDesignAnalysisOutcome } from "./IAutoMovieDesignAnalysisOutcome";

/** One attempted reading of one frame. */
export interface IAutoMovieDesignAnalysis {
  /** Stable analysis identity within the document. */
  id: string;

  /** Frame this analysis read. */
  frame: string;

  /** Open label of the reading attempted, such as `wall-centerline`. */
  subject: string;

  /** Honest outcome of the attempt. */
  outcome: IAutoMovieDesignAnalysisOutcome;
}
