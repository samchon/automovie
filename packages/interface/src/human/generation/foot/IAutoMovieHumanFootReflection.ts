/** Type contracts exchanged by AutoMovieHumanFootReflection; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootReflection {
  /** The list argument of AutoMovieHumanFootReflection.arcs. A left foot's arcs of a ring for a side.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A left foot's arcs of a ring for a side.
   * @evidence contracts/development/design.md#principled-representation A left foot's arcs of a ring for a side. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootReflection.ArcsList is the canonical exchange used by AutoMovieHumanFootReflection.arcs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootReflection.arcs for a left foot's arcs of a ring for a side.
   */
  export type ArcsList = readonly [number, number][];

  /** Result of AutoMovieHumanFootReflection.arcs. A left foot's arcs of a ring for a side.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A left foot's arcs of a ring for a side.
   * @evidence contracts/development/design.md#principled-representation A left foot's arcs of a ring for a side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootReflection.ArcsResult is the canonical exchange used by AutoMovieHumanFootReflection.arcs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootReflection.arcs for a left foot's arcs of a ring for a side.
   */
  export type ArcsResult = [number, number][];
}
