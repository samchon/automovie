import type { IAutoMovieHumanBindingLips } from "./IAutoMovieHumanBindingLips";
import type { IAutoMovieHumanChainRings } from "./IAutoMovieHumanChainRings";
import type { IAutoMovieHumanJointCentres } from "./IAutoMovieHumanJointCentres";
import type { IAutoMovieHumanNeutral } from "./IAutoMovieHumanNeutral";

/**
 * Type contracts exchanged by AutoMovieHumanBindingInputs; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanBindingInputs {
  /** A body's binding inputs. */
  export interface IInputs {
    /** Metres per calibration millimetre. */
    scale: number;

    /**
     * The calibration's stature, millimetres; the pose evaluator's scale reads
     * it.
     */
    stature: number;

    /** The bind skeleton, calibration millimetres, parent before child. */
    joints: IAutoMovieHumanJointCentres.IJoint[];

    /** The skin of every chain, sampled at {@link PHASES} phases per ring. */
    rings: IAutoMovieHumanChainRings[];

    /** The anatomical neutral reached from the bind. */
    neutral: IAutoMovieHumanNeutral.IOutput;

    /**
     * Each joint's largest turn from its parent over its pose channels,
     * radians.
     */
    turns: Map<string, number>;

    /** The crotch's height, metres; infinity for a trunk without a midline. */
    crotch: number;

    /** The lips' contact line, or null for a mouth whose skin is not open. */
    lips: IAutoMovieHumanBindingLips | null;
  }
}
