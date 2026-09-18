import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * A frame time and guide passes required for shot review.
 *
 * @evidence requirements/effects-and-simulation/budgets-and-bounded-work.md#effects-per-frame-shot-budget Exposes `IAutoMovieShotReviewFrame` as the portable data boundary for the effects per frame shot budget requirement.
 * @evidence specifications/simulation-effects-and-sound/budget-admission.md#budget-frame-shot-sequence-composition Types `IAutoMovieShotReviewFrame` for the budget frame shot sequence composition system contract.
 */
export interface IAutoMovieShotReviewFrame {
  /**
   * Stable frame-contract id.
   *
   * @evidence requirements/effects-and-simulation/budgets-and-bounded-work.md#effects-per-frame-shot-budget Exposes `id` as the portable data boundary for the effects per frame shot budget requirement.
   * @evidence specifications/simulation-effects-and-sound/budget-admission.md#budget-frame-shot-sequence-composition Types `id` for the budget frame shot sequence composition system contract.
   */
  id: string;
  /**
   * Time inside the owning shot, snapped exactly to the production frame clock.
   *
   * @evidence requirements/effects-and-simulation/budgets-and-bounded-work.md#effects-per-frame-shot-budget Exposes `time` as the portable data boundary for the effects per frame shot budget requirement.
   * @evidence specifications/simulation-effects-and-sound/budget-admission.md#budget-frame-shot-sequence-composition Types `time` for the budget frame shot sequence composition system contract.
   */
  time: number;
  /**
   * Non-empty unique passes that must be captured.
   *
   * @evidence requirements/effects-and-simulation/budgets-and-bounded-work.md#effects-per-frame-shot-budget Exposes `passes` as the portable data boundary for the effects per frame shot budget requirement.
   * @evidence specifications/simulation-effects-and-sound/budget-admission.md#budget-frame-shot-sequence-composition Types `passes` for the budget frame shot sequence composition system contract.
   */
  passes: AutoMovieGuidePass[];
}
