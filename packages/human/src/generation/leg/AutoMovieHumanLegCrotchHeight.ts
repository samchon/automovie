/**
 * The crotch's height from the inseam's definition: ISO 8559-1 5.7.6 defines
 * the inside leg length as the vertical distance from the crotch to the outer
 * ankle point (the lateral malleolus), so the crotch stands at the inseam
 * plus the lateral malleolus height.
 *
 * The trunk builds its bottom ring at this height and the leg ends on that
 * ring, so the leg's length is the inseam less the ankle ring's rise over the
 * malleolus, never a regression on stature, thigh and sex. The former fitted
 * line read 6.7, 6.2 mm under this on f1 and f2, 4.3 mm over on m1 and 8.9 mm
 * under on m2.
 */
export namespace AutoMovieHumanLegCrotchHeight {
  /** What the crotch height is placed from. */
  export interface IInput {
    /** Inseam, calibration mm: the body control, the specimen's when unknown. */
    inseam: number;

    /** Lateral malleolus height, calibration mm: the feet's `ankleHeight` inputs, the mean of the two sides. */
    ankleHeight: number;
  }

  /**
   * The crotch height.
   *
   * @param input The inseam and the lateral malleolus height.
   * @returns Crotch height above the floor, calibration mm.
   * @throws {Error} When either input is not positive.
   */
  export function of(input: IInput): number {
    if (!(input.inseam > 0) || !(input.ankleHeight > 0))
      throw new Error("The crotch height needs a positive inseam and ankle height");

    // The inseam ends at the outer ankle point, not at the floor.
    return input.inseam + input.ankleHeight;
  }
}
