import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";

/**
 * Type contracts exchanged by AutoMovieHumanDeltoidCap; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanDeltoidCap {
  /** An ellipse in a horizontal plane. */
  export interface IOval {
    /** Forward place of the centre, mm. */
    x: number;

    /** Lateral place of the centre, mm. */
    z: number;

    /** Forward half size, mm. */
    rx: number;

    /** Lateral half size, mm. */
    rz: number;
  }

  /** What the cap reads. */
  export interface IInput {
    /** The glenohumeral centre `[x, y, z]`, mm. */
    glenohumeral: readonly [number, number, number];

    /** The cap's outline from the centre's height to the shoulder point. */
    outline: IAutoMovieHumanShoulderOutline;
  }
}
