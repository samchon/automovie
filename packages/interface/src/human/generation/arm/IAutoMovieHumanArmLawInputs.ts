/** Type contracts exchanged by AutoMovieHumanArmLaw; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmLawInputs {
  /** The lengths and tapes the law reads, calibration mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The lengths and tapes the law reads, calibration mm.
   * @evidence contracts/development/design.md#principled-representation `upper`: Acromion-radiale length. `acromionProjection`: Actual downward acromion-to-GH projection, calibration mm. `lower`: Radiale-stylion length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanArmLaw.centreOf, AutoMovieHumanArmLaw.of. Also types AutoMovieHumanArmConstruction.lawInputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `upper`, `acromionProjection`, `lower`, `bicep`, `elbow`, `forearm`, `wrist`, `scale`; callers supply the complete record.
   */
  export interface IInputs {
    /** Acromion-radiale length. */
    upper: number;
    /** Actual downward acromion-to-GH projection, calibration mm. */
    acromionProjection: number;

    /** Radiale-stylion length. */
    lower: number;

    /** Biceps tape. */
    bicep: number;

    /** Elbow tape. */
    elbow: number;

    /** Forearm tape. */
    forearm: number;

    /** Wrist tape. */
    wrist: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }
}
