import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkColumn } from "./IAutoMovieHumanTrunkColumn";

/**
 * The torso column and trapezius outline consumed by shoulder-girdle
 * construction.
 *
 * The interface package owns these declarations; AutoMovieHumanShoulderGirdle
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanShoulderGirdle {
  /** What the girdle reads. */
  export interface IInput {
    /** The torso's column through the shoulders. */
    column: IAutoMovieHumanTrunkColumn.IColumn;

    /** The trapezius line, from the shoulder point to the neck's ring. */
    line: IAutoMovieHumanShoulderOutline;
  }
}
