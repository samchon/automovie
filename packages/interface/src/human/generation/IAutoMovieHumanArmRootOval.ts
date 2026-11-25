import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";

/**
 * Type contracts exchanged by AutoMovieHumanArmRootOval; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanArmRootOval {
  /** What the oval reads. */
  export interface IInput {
    /** The glenohumeral centre `[x, y, z]`, mm. */
    glenohumeral: readonly [number, number, number];

    /** The upper arm's girth radius, mm: the biceps tape over 2 pi. */
    radius: number;

    /** The cap's outline from the centre's height to the shoulder point. */
    cap: IAutoMovieHumanShoulderOutline;
  }
}
