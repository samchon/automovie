import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";
import type { IAutoMovieHumanTrunkReliefNet } from "./IAutoMovieHumanTrunkReliefNet";

/** Type contracts exchanged by AutoMovieHumanGlutealRelief; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanGlutealRelief {
  /** What the merge reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the merge reads.
   * @evidence contracts/development/design.md#principled-representation `dome`: The gluteal mass. `base`: The trunk's base surface: the body point at a height and a phase. `phaseOf`: The base's phase at a lateral place on the back at the buttock point's height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanGlutealRelief.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `dome`, `base`, `phaseOf`; callers supply the complete record.
   */
  export interface IInput {
    /** The gluteal mass. */
    dome: IAutoMovieHumanTrunkFeature;

    /** The trunk's base surface: the body point at a height and a phase. */
    base: IAutoMovieHumanTrunkReliefNet.Base;

    /** The base's phase at a lateral place on the back at the buttock point's height. */
    phaseOf: (z: number) => number;
  }
}
