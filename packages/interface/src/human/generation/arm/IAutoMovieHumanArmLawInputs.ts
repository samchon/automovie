/**
 * Calibration lengths, tapes and the calibration-to-world scale consumed by the arm law. Runtime construction and admission remain with AutoMovieHumanArmLaw in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes calibration lengths, tapes and the calibration-to-world scale consumed by the arm law; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Calibration lengths, tapes and the calibration-to-world scale consumed by the arm law. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanArmLaw; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing ArmLawInputs contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
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
