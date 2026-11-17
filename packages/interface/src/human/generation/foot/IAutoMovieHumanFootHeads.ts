import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanFootHeads; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootHeads {
  /** The heads and their mean.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The heads and their mean.
   * @evidence contracts/development/design.md#principled-representation `heads`: Head centres, hallux first, left frame. `ball`: Mean of the heads, left frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootHeads.of. Also types AutoMovieHumanFootBones.heads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `heads`, `ball`; callers supply the complete record.
   */
  export interface IHeads {
    /** Head centres, hallux first, left frame. */
    heads: AutoMovieVector3Tuple[];

    /** Mean of the heads, left frame. */
    ball: AutoMovieVector3Tuple;
  }
}
