import type { IAutoMovieExpression } from "../../expression/IAutoMovieExpression";
import type { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/** Data and callback contracts shared by the SampleDialogueExpression operations. */
export namespace IAutoMovieSampleDialogueExpression {
  /**
   * Sample one joined emission-clock mouth range beside the unchanged authored expression.
   */
  export type IProps = {
    /** Compiled actor mouth timeline. */
    timeline: IAutoMovieDialogueVisemeTimeline;
    /** Film-global frame to sample. */
    frame: number;
    /** Authored emotion/expression, retained unchanged. */
    authored: IAutoMovieExpression | null;
  };
}
