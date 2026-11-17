import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanCrotchBinding; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanCrotchBinding {
  /** Where the release lies.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Where the release lies.
   * @evidence contracts/development/design.md#principled-representation `at`: Point where the release is half done, metres. `half`: Half of the release, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanCrotchBinding.release. Also types AutoMovieHumanCrotchBinding.moved.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `half`; callers supply the complete record.
   */
  export interface IRelease {
    /** Point where the release is half done, metres. */
    at: AutoMovieVector3Tuple;

    /** Half of the release, metres. */
    half: number;
  }
}
