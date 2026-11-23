import type { IAutoMovieExpression } from "../../expression/IAutoMovieExpression";
import type { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/**
 * Data and callback contracts shared by the SampleDialogueExpression
 * operations.
 */
export namespace IAutoMovieSampleDialogueExpression {
  /**
   * Sample one joined emission-clock mouth range beside the unchanged authored
   * expression.
   *
   * A nonnegative safe-integer frame selects the first containing half-open
   * interval. An active vowel gives mouth intensity one; rest or no containing
   * interval gives neutral intensity zero. Invalid frame addresses throw, while
   * the timeline is assumed to have passed the join and is not revalidated.
   * Each call creates a wrapper and mouth record retaining the authored
   * expression by reference. Arbitrary seeks share no cursor, and actor
   * application is separate.
   */
  export type IProps = {
    /**
     * Borrowed joined actor mouth timeline with ordered half-open film-frame
     * intervals.
     */
    timeline: IAutoMovieDialogueVisemeTimeline;
    /**
     * Nonnegative safe-integer film-global frame; outside all ranges produces a
     * neutral mouth.
     */
    frame: number;
    /**
     * Authored emotion/expression, retained by reference unchanged in the
     * returned layers; null preserves absence.
     */
    authored: IAutoMovieExpression | null;
  };
}
