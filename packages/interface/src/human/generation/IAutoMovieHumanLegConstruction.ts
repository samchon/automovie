/**
 * Calibration leg tapes, body controls and optional measured gluteal-furrow
 * height. Runtime construction and admission remain with
 * AutoMovieHumanLegConstruction in Human.
 */
export namespace IAutoMovieHumanLegConstruction {
  /** Tape measures a leg reads, in the same millimetres as the calibration. */
  export interface IInputs {
    /** Calf tape. */
    calf: number;

    /** Knee tape. */
    knee: number;

    /** Thigh tape. */
    thigh: number;

    /** Hip tape, which spreads the legs. */
    hip: number;

    /** Masculine-feminine control, which brings the knees in as it rises. */
    sex: number;

    /** Fat control. */
    fat: number;

    /** Muscularity control. */
    muscularity: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /**
     * Gluteal furrow height, the gluteal fold's lowest point over the floor
     * (ANSUR 1988), in calibration millimetres: the thigh tape's station (ISO
     * 8559-1 5.3.20, just below the fold) and the infragluteal fold's centre.
     * Absent, both stand at their declared places on the thigh.
     */
    furrow?: number;
  }
}
