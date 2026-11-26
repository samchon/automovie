/**
 * Calibration lengths, tapes and the calibration-to-world scale consumed by the
 * arm law. Runtime construction and admission remain with AutoMovieHumanArmLaw
 * in Human.
 */
export namespace IAutoMovieHumanArmLawInputs {
  /** The lengths and tapes the law reads, calibration mm. */
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
