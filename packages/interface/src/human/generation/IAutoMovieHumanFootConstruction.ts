import type { IAutoMovieHumanFootFrame } from "./foot/IAutoMovieHumanFootFrame";

/**
 * Bilateral foot dimensions and the body-to-calibration scale consumed by
 * construction. Runtime construction and admission remain with
 * AutoMovieHumanFootConstruction in Human.
 */
export namespace IAutoMovieHumanFootConstruction {
  /** What a foot reads. */
  export interface IInputs {
    /** Left foot. */
    left: IAutoMovieHumanFootFrame.IDimensions;

    /** Right foot. */
    right: IAutoMovieHumanFootFrame.IDimensions;

    /** Fat control; the foot's form takes no published relation to it. */
    fat: number;

    /** Muscularity control; likewise unread by the form. */
    muscularity: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }
}
