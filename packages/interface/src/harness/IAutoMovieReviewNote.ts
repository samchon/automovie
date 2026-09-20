/**
 * A reviewer's note on a built shot: the feedback that drives a
 * re-block/re-perform.
 *
 * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `IAutoMovieReviewNote` as the portable data boundary for the story time state review scope requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `IAutoMovieReviewNote` for the narrative intent temporal state handoff system contract.
 */
export interface IAutoMovieReviewNote {
  /**
   * Which beat/shot the note is about.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `beat` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `beat` for the narrative intent temporal state handoff system contract.
   */
  beat: string;

  /**
   * Which tier raised it.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `tier` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `tier` for the narrative intent temporal state handoff system contract.
   */
  tier: "structural" | "physical" | "visual";

  /**
   * What is wrong, located as concretely as possible ("left foot skates at
   * t=1.2s").
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `issue` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `issue` for the narrative intent temporal state handoff system contract.
   */
  issue: string;

  /**
   * A suggested fix the next pass should apply.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `suggestion` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `suggestion` for the narrative intent temporal state handoff system contract.
   */
  suggestion: string;
}
