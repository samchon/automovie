import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";
import type { IAutoMovieHumanTrunkReliefNet } from "./IAutoMovieHumanTrunkReliefNet";

/**
 * The gluteal mass, original trunk surface and lateral-to-material-phase lookup
 * used by relief composition. Runtime construction and admission remain with
 * AutoMovieHumanGlutealRelief in Human.
 */
export namespace IAutoMovieHumanGlutealRelief {
  /** What the merge reads. */
  export interface IInput {
    /** The gluteal mass. */
    dome: IAutoMovieHumanTrunkFeature;

    /** The trunk's base surface: the body point at a height and a phase. */
    base: IAutoMovieHumanTrunkReliefNet.Base;

    /**
     * The base's phase at a lateral place on the back at the buttock point's
     * height.
     */
    phaseOf: (z: number) => number;
  }
}
