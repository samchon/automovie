import type { IAutoMovieHumanTrunkKey } from "./IAutoMovieHumanTrunkKey";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";

/** Type contracts exchanged by AutoMovieHumanTrunkColumn; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkColumn {
  /** The column.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The column.
   * @evidence contracts/development/design.md#principled-representation `at`: The section's measures at a height. `keys`: The keys, by rising height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkColumn.create, AutoMovieHumanTrunkKeys.column. Read by AutoMovieHumanTrunkCourses.backNeckToWaist, AutoMovieHumanTrunkCourses.sideNeckToBust, AutoMovieHumanTrunkCourses.acrossBack. Also types AutoMovieHumanTrunkClosure.col, AutoMovieHumanTrunkSolver.col.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `keys`; callers supply the complete record.
   */
  export interface IColumn {
    /** The section's measures at a height. */
    at: (y: number) => IAutoMovieHumanTrunkSection;

    /** The keys, by rising height. */
    keys: IAutoMovieHumanTrunkKey[];
  }
}
