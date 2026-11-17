import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanTrunkFeatureFrame; runtime evaluation remains in Human. */
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
