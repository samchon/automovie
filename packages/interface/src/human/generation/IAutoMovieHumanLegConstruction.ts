/** Type contracts exchanged by AutoMovieHumanLegConstruction; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegConstruction {
  /** Tape measures a leg reads, in the same millimetres as the calibration.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Tape measures a leg reads, in the same millimetres as the calibration.
   * @evidence contracts/development/design.md#principled-representation `calf`: Calf tape. `knee`: Knee tape. `thigh`: Thigh tape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by tapes. Read by crotch, feet, AutoMovieHumanLegConstruction.apply. Also types AutoMovieHumanBodyLaw.legs, AutoMovieHumanBodyLaw.inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `furrow`: Gluteal furrow height, the gluteal fold's lowest point over the floor (ANSUR 1988), in calibration millimetres: the thigh tape's station (ISO 8559-1 5.3.20, just below the fold) and the infragluteal fold's centre.
   */
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
