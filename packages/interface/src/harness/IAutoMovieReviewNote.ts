/**
 * A reviewer's note on a built shot: the feedback that drives a
 * re-block/re-perform.
 */
export interface IAutoMovieReviewNote {
  /** Which beat/shot the note is about. */
  beat: string;

  /** Which tier raised it. */
  tier: "structural" | "physical" | "visual";

  /**
   * What is wrong, located as concretely as possible ("left foot skates at
   * t=1.2s").
   */
  issue: string;

  /** A suggested fix the next pass should apply. */
  suggestion: string;
}
