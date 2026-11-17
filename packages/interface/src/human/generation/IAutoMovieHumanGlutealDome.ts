import type { IAutoMovieHumanTrunkFeatureFrame } from "./IAutoMovieHumanTrunkFeatureFrame";

/** Type contracts exchanged by AutoMovieHumanGlutealDome; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanGlutealDome {
  /** What the dome reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the dome reads.
   * @evidence contracts/development/design.md#principled-representation `frame`: The gluteal frame. `width`: The section's half width at the buttock point, mm. `lower`: The buttock point's height over the crotch ring, mm: the footprint's lower reach.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanGlutealDome.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `width`, `lower`, `upper`, `projection`; callers supply the complete record.
   */
  export interface IInput {
    /** The gluteal frame. */
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame;

    /** The section's half width at the buttock point, mm. */
    width: number;

    /** The buttock point's height over the crotch ring, mm: the footprint's lower reach. */
    lower: number;

    /** Iliocristale's height over the buttock point, mm: the footprint's upper reach. */
    upper: number;

    /** The buttock point's projection, mm. */
    projection: number;
  }
}
