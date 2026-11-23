import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Swing-direction and clinical-twist coordinates used by swingTwistRange. The
 * caller supplies an admitted swingTwist constraint and stable joint axes/rest
 * frame; range tables are cached by their identities.
 */
export namespace IAutoMovieSwingTwistRange {
  /** A rotation read by swing and twist. */
  export interface IReading {
    /** The limb's direction, unit, in the bone's rest frame. */
    direction: IAutoMovieVector3;

    /** The angle from the rest direction to the limb's direction, degrees. */
    swing: number;

    /**
     * The great circle the direction lies on, degrees about the rest direction
     * from the flexion axis.
     */
    azimuth: number;

    /** The twist about the rest direction, clinical degrees in [-180, 180). */
    twist: number;
  }
}
