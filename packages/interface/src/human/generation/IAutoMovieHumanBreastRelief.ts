import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";
import type { IAutoMovieHumanTrunkReliefNet } from "./IAutoMovieHumanTrunkReliefNet";

/**
 * A breast dome and its original trunk-chart surface and phase lookup.
 *
 * The interface package owns these declarations; AutoMovieHumanBreastRelief in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanBreastRelief {
  /** What the merge reads. */
  export interface IInput {
    /** The breast's dome. */
    dome: IAutoMovieHumanTrunkFeature;

    /** The trunk's base surface: the body point at a height and a phase. */
    base: IAutoMovieHumanTrunkReliefNet.Base;

    /**
     * The base's phase at a lateral place on the front at the bust point's
     * height.
     */
    phaseOf: (z: number) => number;
  }
}
