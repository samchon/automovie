import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";
import type { IAutoMovieHumanTrunkReliefNet } from "./IAutoMovieHumanTrunkReliefNet";

/** Type contracts exchanged by AutoMovieHumanBreastRelief; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanBreastRelief {
  /** What the merge reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the merge reads.
   * @evidence contracts/development/design.md#principled-representation `dome`: The breast's dome. `base`: The trunk's base surface: the body point at a height and a phase. `phaseOf`: The base's phase at a lateral place on the front at the bust point's height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBreastRelief.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `dome`, `base`, `phaseOf`; callers supply the complete record.
   */
  export interface IInput {
    /** The breast's dome. */
    dome: IAutoMovieHumanTrunkFeature;

    /** The trunk's base surface: the body point at a height and a phase. */
    base: IAutoMovieHumanTrunkReliefNet.Base;

    /** The base's phase at a lateral place on the front at the bust point's height. */
    phaseOf: (z: number) => number;
  }
}
