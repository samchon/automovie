/**
 * The timeline a production asserts its events happened on.
 *
 * The edit is presentation, not chronology: a cut list can only place shots one
 * after another, so two groups acting at the same moment are merely adjacent in
 * it and nothing can check the claim. The story clock is the second timeline,
 * independent of the cut, on which each pinned shot occupies a real interval.
 * Two shots may overlap on it, and a shot may carry an earlier story time than
 * the one it is cut after.
 *
 * Declaring the clock is what makes shot pins and cross-shot criteria legal. A
 * production that asserts nothing about story time omits it and is unaffected.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieStoryClock` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieStoryClock` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieStoryClock {
  /**
   * Story-clock unit.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `units` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `units` for the narrative intent story design ownership system contract.
   */
  units: "second";
  /**
   * Non-blank statement of what story time zero denotes.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `epoch` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `epoch` for the narrative intent story design ownership system contract.
   */
  epoch: string;
}
