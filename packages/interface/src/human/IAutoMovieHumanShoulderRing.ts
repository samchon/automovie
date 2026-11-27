import type { IAutoMovieHumanArmRootOval } from "./IAutoMovieHumanArmRootOval";
import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkColumn } from "./IAutoMovieHumanTrunkColumn";

/**
 * Type contracts exchanged by AutoMovieHumanShoulderRing; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanShoulderRing {
  /** What a shoulder ring reads. */
  export interface IInput {
    /** The torso's column through the shoulders. */
    column: IAutoMovieHumanTrunkColumn.IColumn;

    /** The trapezius line, from the shoulder point to the neck's ring. */
    line: IAutoMovieHumanShoulderOutline;

    /** The arm's ellipse and its cap. */
    oval: IAutoMovieHumanArmRootOval.IInput;

    /** Height of the axilla, the ring's bottom, mm. */
    axilla: number;
  }
}
