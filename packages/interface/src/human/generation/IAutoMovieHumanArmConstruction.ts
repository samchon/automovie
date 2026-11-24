import type { IAutoMovieHumanHandMeasures } from "./hand/IAutoMovieHumanHandMeasures";

/**
 * Type contracts exchanged by AutoMovieHumanArmConstruction; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanArmConstruction {
  /** What an arm reads. */
  export interface IInputs {
    /** Upper arm length. */
    upper: number;

    /** Lower arm length. */
    lower: number;

    /** Biceps tape. */
    bicep: number;

    /** Elbow tape. */
    elbow: number;

    /** Forearm tape. */
    forearm: number;

    /** Wrist tape. */
    wrist: number;

    /** Hand tape. */
    circumference: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Left hand. */
    left: IAutoMovieHumanHandMeasures;

    /** Right hand. */
    right: IAutoMovieHumanHandMeasures;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }
}
