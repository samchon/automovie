/**
 * The units producers read their sources in, as the package's metres, kilograms
 * and radians: one owner for every conversion.
 *
 * The inch, the foot and the pound are the international ones the 1959
 * international yard and pound agreement fixed exactly (US National Bureau of
 * Standards, Federal Register notice of 1 July 1959: the yard 0.9144 m, the
 * pound 0.453 592 37 kg), the foot twelve inches, the ounce a sixteenth of that
 * pound; the degree is a 180th of pi radians.
 */
export namespace AutoMovieArchetypeUnits {
  /** One inch, metres: 0.0254 exactly, a 36th of the international yard. */
  export const INCH: number = 0.0254;

  /** One foot, metres: 12 inches, a third of the international yard. */
  export const FOOT: number = 12 * INCH;

  /** One pound, kilograms: 0.45359237 exactly, the international pound. */
  export const POUND: number = 0.45359237;

  /** One ounce, kilograms: a 16th of the international pound. */
  export const OUNCE: number = POUND / 16;

  /** One millimetre, metres: 0.001 exactly, the SI prefix milli. */
  export const MILLIMETRE: number = 0.001;

  /** One centimetre, metres: 0.01 exactly, the SI prefix centi. */
  export const CENTIMETRE: number = 0.01;

  /** One degree, radians. */
  export const DEGREE: number = Math.PI / 180;

  /**
   * A tyre's outer diameter from its metric size, metres, such as 185/60 R15:
   * the rim's diameter plus twice the sidewall, whose height is the section
   * width times the aspect ratio, as the size designation defines them.
   *
   * @param width The section width, millimetres.
   * @param aspect The aspect ratio, the sidewall's height over the section
   *   width, percent.
   * @param rim The rim's diameter, inches.
   * @returns The outer diameter.
   */
  export function tyre(width: number, aspect: number, rim: number): number {
    return rim * INCH + (2 * width * MILLIMETRE * aspect) / 100;
  }
}
