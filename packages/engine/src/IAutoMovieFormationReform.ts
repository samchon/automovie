import { IAutoMovieFormationDesign } from "@automovie/interface";

/**
 * The arrangement a unit is travelling toward, and how far along it is.
 *
 * Carried beside the sampled state rather than inside it, because `from` and
 * `to` are what an author writes and a re-form is a property of the cue rather
 * than of either end: a cue states one target arrangement, and both its ends
 * describe the same unit standing in different places. `progress` is the cue's
 * own eased progress, so a re-form bends on the curve its author declared and
 * not on a second one.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Carries the target layout and eased progress needed to reproduce an interior reform sample.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Makes reform state an explicit deterministic result instead of hidden sampler history.
 */
export interface IAutoMovieFormationReform {
  /**
   * The arrangement the unit is in when the cue ends.
   *
   * @evidence requirements/formations/budgets-and-validation.md#formation-motion-validation Exposes the target arrangement whose capacity, ground, and motion interior must be checked.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-geometry-layout-motion-validation Carries the reform layout into the temporal validation surface.
   */
  layout: IAutoMovieFormationDesign["layout"];
  /**
   * Eased fraction of the way there, 0 at the cue's start and 1 at its end.
   *
   * @evidence requirements/formations/budgets-and-validation.md#formation-motion-validation Identifies the exact interior state at which reform geometry is evaluated.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-geometry-layout-motion-validation Lets validation inspect cue interiors rather than endpoints alone.
   */
  progress: number;
}
