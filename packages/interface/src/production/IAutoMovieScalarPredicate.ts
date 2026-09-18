/**
 * A scalar comparison evaluated by the deterministic builder.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieScalarPredicate` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieScalarPredicate` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieScalarPredicate {
  /**
   * Numeric comparison.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `operator` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `operator` for the narrative intent story design ownership system contract.
   */
  operator: "<=" | ">=" | "==";
  /**
   * Finite expected value in the unit implied by the selected predicate.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `value` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `value` for the narrative intent story design ownership system contract.
   */
  value: number;
  /**
   * Finite non-negative absolute comparison tolerance.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `tolerance` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `tolerance` for the narrative intent story design ownership system contract.
   */
  tolerance: number;
}
