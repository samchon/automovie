import type { IAutoMovieExpression } from "../../expression/IAutoMovieExpression";
import type { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/**
 * Data and callback contracts shared by the SampleDialogueExpression operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sample one joined emission-clock mouth range beside the unchanged authored expression. Member documentation states the supplied records, units and absence meanings used by sampleAutoMovieDialogueExpression.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Authored emotion and receipt-derived mouth motion remain separate inputs; the sampler does not reinterpret film frame as a shot-local or propagation-arrival clock.
 * @evidence contracts/development/design.md#principled-representation timeline supplies joined actor mouth intervals, frame is film-global and authored is the nullable expression retained beside the sampled mouth range.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieSampleDialogueExpression, used by sampleAutoMovieDialogueExpression. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieSampleDialogueExpression {
  /**
   * Sample one joined emission-clock mouth range beside the unchanged authored expression.
   *
   * A nonnegative safe-integer frame selects the first containing half-open
   * interval. An active vowel gives mouth intensity one; rest or no containing
   * interval gives neutral intensity zero. Invalid frame addresses throw, while
   * the timeline is assumed to have passed the join and is not revalidated. Each
   * call creates a wrapper and mouth record retaining the authored expression by
   * reference. Arbitrary seeks share no cursor, and actor application is separate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Sample one joined emission-clock mouth range beside the unchanged authored expression. Member documentation states the supplied records, units and absence meanings used by sampleAutoMovieDialogueExpression.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Authored emotion and receipt-derived mouth motion remain separate inputs; the sampler does not reinterpret film frame as a shot-local or propagation-arrival clock.
   * @evidence contracts/development/design.md#principled-representation timeline supplies joined actor mouth intervals, frame is film-global and authored is the nullable expression retained beside the sampled mouth range.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieSampleDialogueExpression.IProps, used by sampleAutoMovieDialogueExpression. Its timeline, frame, authored members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Borrowed joined actor mouth timeline with ordered half-open film-frame intervals. */
    timeline: IAutoMovieDialogueVisemeTimeline;
    /** Nonnegative safe-integer film-global frame; outside all ranges produces a neutral mouth. */
    frame: number;
    /** Authored emotion/expression, retained by reference unchanged in the returned layers; null preserves absence. */
    authored: IAutoMovieExpression | null;
  };
}
