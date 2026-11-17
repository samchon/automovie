import type { IAutoMovieLoftRelief } from "../../construction/IAutoMovieLoftRelief";
import type { IAutoMovieHumanTrunkColumn } from "./IAutoMovieHumanTrunkColumn";

/** Type contracts exchanged by AutoMovieHumanTrunkClosure; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkClosure {
  /** A function of the column giving the reliefs that act at a tape's site.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A function of the column giving the reliefs that act at a tape's site.
   * @evidence contracts/development/design.md#principled-representation A function of the column giving the reliefs that act at a tape's site. The callable takes col and returns IAutoMovieLoftRelief[].
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanTrunkClosure.girthAt. Also types AutoMovieHumanTrunkClosure.none.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkClosure.girthAt, AutoMovieHumanTrunkClosure.none, AutoMovieHumanTrunkClosure.close for a function of the column giving the reliefs that act at a tape's site.
   */
  export type Reliefs = (
    col: IAutoMovieHumanTrunkColumn.IColumn,
  ) => IAutoMovieLoftRelief[];
}
