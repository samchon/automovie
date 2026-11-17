/** Type contracts exchanged by AutoMovieHumanShoulderCap; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanShoulderCap {
  /** The arm's outer edge at the glenohumeral centre's height.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The arm's outer edge at the glenohumeral centre's height.
   * @evidence contracts/development/design.md#principled-representation `y`: Height of the glenohumeral centre, mm. `z`: Lateral place of the glenohumeral centre, mm. `radius`: The upper arm's girth radius, mm: the biceps tape over 2 pi.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanShoulderCap.extreme, AutoMovieHumanShoulderCap.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `y`, `z`, `radius`; callers supply the complete record.
   */
  export interface IEdge {
    /** Height of the glenohumeral centre, mm. */
    y: number;

    /** Lateral place of the glenohumeral centre, mm. */
    z: number;

    /** The upper arm's girth radius, mm: the biceps tape over 2 pi. */
    radius: number;
  }
}
