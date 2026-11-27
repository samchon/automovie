/**
 * Own-side auricle directions, public dimensions and relief scaling in
 * calibration millimetres.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadEarFrame in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadEarFrame {
  /** Own-side dimensions and orientation in calibration mm. */
  export interface IFrame {
    /** Outward side-outline normal at the selected tragion height. */
    n: [number, number, number];
    /** Unit sa-sba chord direction, upward. */
    a: [number, number, number];
    /** Forward unit direction perpendicular to a and n. */
    b: [number, number, number];
    /** Selected highest superaurale height. */
    top: number;
    /** Lowest subaurale height, top - length*a.y. */
    bottom: number;
    /** Public sa-sba chord length. */
    length: number;
    /** Public c-j chord length. */
    breadth: number;
    /** Public scalp-to-rim distance at the tragal level. */
    protrusion: number;
    /** Retained relief-row scale, world breadth/31 mm. */
    scale: number;
    /** Own side, positive left and negative right. */
    sign: 1 | -1;
  }
}
