/**
 * Converts catalogue measurements to metres, kilograms and radians.
 */
export namespace AutoMovieArchetypeUnits {
  /** Metres per international inch, defined as 0.0254 metres. */
  export const INCH: number = 0.0254;

  /** Metres per international foot, equal to twelve international inches. */
  export const FOOT: number = 12 * INCH;

  /** Kilograms per international avoirdupois pound, defined as 0.45359237. */
  export const POUND: number = 0.45359237;

  /** Kilograms per avoirdupois ounce, equal to one sixteenth of a pound. */
  export const OUNCE: number = POUND / 16;

  /** Metres per millimetre, equal to 0.001. */
  export const MILLIMETRE: number = 0.001;

  /** Metres per centimetre, equal to 0.01. */
  export const CENTIMETRE: number = 0.01;

  /** Radians per degree, equal to pi divided by 180. */
  export const DEGREE: number = Math.PI / 180;

  /**
   * Compute the outer diameter from a metric tyre size.
   *
   * @param width Section width in millimetres.
   * @param aspect Sidewall height as a percentage of section width.
   * @param rim Rim diameter in inches.
   * @returns Outer diameter in metres, including both sidewalls.
   * @example
   * AutoMovieArchetypeUnits.tyre(185, 60, 15); // 0.603 metres
   */
  export function tyre(width: number, aspect: number, rim: number): number {
    return rim * INCH + (2 * width * MILLIMETRE * aspect) / 100;
  }
}
