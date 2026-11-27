import type { IAutoMovieLoftRelief } from "../construction/IAutoMovieLoftRelief";
import type { IAutoMovieHumanTrunkColumn } from "./IAutoMovieHumanTrunkColumn";

/**
 * A callback selecting the reliefs acting at a tape site for a candidate trunk
 * column.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkClosure in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkClosure {
  /** A function of the column giving the reliefs that act at a tape's site. */
  export type Reliefs = (
    col: IAutoMovieHumanTrunkColumn.IColumn,
  ) => IAutoMovieLoftRelief[];
}
