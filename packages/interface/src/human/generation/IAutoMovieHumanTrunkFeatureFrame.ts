import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * The wall origin and orthogonal outward/up/lateral frame used by a trunk relief. Runtime construction and admission remain with AutoMovieHumanTrunkFeatureFrame in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the wall origin and orthogonal outward/up/lateral frame used by a trunk relief; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation The wall origin and orthogonal outward/up/lateral frame used by a trunk relief. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanTrunkFeatureFrame; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing TrunkFeatureFrame contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanTrunkFeatureFrame {
  /** A feature's frame.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A feature's frame.
   * @evidence contracts/development/design.md#principled-representation `origin`: The feature's centre on the wall, mm. `axis`: Unit axis the height is measured along, outward. `up`: Unit in-plane axis, the feature's up, perpendicular to the axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBreastFrame.create, AutoMovieHumanGlutealFrame.create, AutoMovieHumanSternalNotch.frame. Read by AutoMovieHumanSpinalGroove.feature, AutoMovieHumanSpinalGroove.create, AutoMovieHumanSternalNotch.feature. Also types AutoMovieHumanScapularMass.frame, AutoMovieHumanTrunkFeatures.frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `origin`, `axis`, `up`, `lateral`; callers supply the complete record.
   */
  export interface IFrame {
    /** The feature's centre on the wall, mm. */
    origin: AutoMovieVector3Tuple;

    /** Unit axis the height is measured along, outward. */
    axis: AutoMovieVector3Tuple;

    /** Unit in-plane axis, the feature's up, perpendicular to the axis. */
    up: AutoMovieVector3Tuple;

    /** Unit in-plane axis toward the body's left, `axis x up`. */
    lateral: AutoMovieVector3Tuple;
  }
}
