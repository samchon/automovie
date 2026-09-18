/**
 * Where one shot sits on the production story clock.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieShotStoryTime` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieShotStoryTime` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieShotStoryTime {
  /**
   * Finite story-clock time in seconds at shot-local time zero.
   *
   * Two shots sharing an origin open on the same story moment however far apart
   * the cut places them, and a shot cut later may carry the smaller origin.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `originSeconds` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `originSeconds` for the narrative intent story design ownership system contract.
   */
  originSeconds: number;
  /**
   * Story seconds elapsed per shot-local second; finite and strictly above
   * zero. Omitted means one, so shot time and story time run together.
   *
   * A shot that stretches or compresses time still maps onto the clock: the
   * story time of shot-local `t` is `originSeconds + t * rate`.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `rate` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `rate` for the narrative intent story design ownership system contract.
   */
  rate?: number;
}
