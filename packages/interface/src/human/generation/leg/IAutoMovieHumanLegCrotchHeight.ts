/**
 * Calibration inseam and bilateral mean ankle height used to place the crotch.
 * Runtime construction and admission remain with AutoMovieHumanLegCrotchHeight
 * in Human.
 */
export namespace IAutoMovieHumanLegCrotchHeight {
  /** What the crotch height is placed from. */
  export interface IInput {
    /** Inseam, calibration mm: the body control, the specimen's when unknown. */
    inseam: number;

    /**
     * Lateral malleolus height, calibration mm: the feet's `ankleHeight`
     * inputs, the mean of the two sides.
     */
    ankleHeight: number;
  }
}
