import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Calibration-millimetre foot dimensions and the map from normalized foot coordinates into the left frame.
 *
 * The interface package owns these declarations; AutoMovieHumanFootFrame in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootFrame {
  /** A foot's dimensions in calibration millimetres.
   */
  export interface IDimensions {
    /** Back of the heel to the tip of the longest toe. */
    length: number;

    /** Greatest breadth across the metatarsal heads. */
    breadth: number;

    /** Height of the lateral malleolus. */
    ankle: number;

    /** Optional positive length ratio for all toe phalanges. Metatarsal positions and ankle height retain their original measures. */
    phalangealLengthScale?: number;
  }

  /** A foot's frame: its scales and the map from normalised coordinates.
   */
  export interface IFrame {
    /** Foot length, mm. */
    L: number;

    /** Foot breadth, mm. */
    B: number;

    /** Lateral malleolus height, mm. */
    H: number;

    /** Ankle ring height, mm. */
    ring: number;

    /**
     * World point of normalised foot coordinates `[a, u, y mm]`, left frame.
     */
    at: (a: number, u: number, y: number) => AutoMovieVector3Tuple;

    /** The foot's lateral direction, left frame. */
    lateral: AutoMovieVector3Tuple;
  }
}
