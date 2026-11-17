import type { IAutoMovieHumanFootFrame } from "./foot/IAutoMovieHumanFootFrame";

/** Type contracts exchanged by AutoMovieHumanFootConstruction; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootConstruction {
  /** What a foot reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a foot reads.
   * @evidence contracts/development/design.md#principled-representation `left`: Left foot. `right`: Right foot. `fat`: Fat control; the foot's form takes no published relation to it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyLaw.footDimensions, feet. Read by AutoMovieHumanFootConstruction.add, AutoMovieHumanFootConstruction.bones.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `left`, `right`, `fat`, `muscularity`, `scale`; callers supply the complete record.
   */
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
