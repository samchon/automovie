/** Type contracts exchanged by AutoMovieHumanTrunkTapes; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkTapes {
  /** Result of AutoMovieHumanTrunkTapes.points. A section's points in its plane `[x, z]`, the reliefs that reach its
  height moving them along their axes.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A section's points in its plane `[x, z]`, the reliefs that reach its height moving them along their axes.
 * @evidence contracts/development/design.md#principled-representation A section's points in its plane `[x, z]`, the reliefs that reach its height moving them along their axes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkTapes.PointsResult is the canonical exchange used by AutoMovieHumanTrunkTapes.points.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkTapes.points for a section's points in its plane `[x, z]`, the reliefs that reach its height moving them along their axes.
 */
  export type PointsResult = [number, number][];

  /** The points argument of AutoMovieHumanTrunkTapes.hull. Hull perimeter of planar points.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Hull perimeter of planar points.
   * @evidence contracts/development/design.md#principled-representation Hull perimeter of planar points. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkTapes.HullPoints is the canonical exchange used by AutoMovieHumanTrunkTapes.hull.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkTapes.hull for hull perimeter of planar points.
   */
  export type HullPoints = readonly [number, number][];

  /** The girth argument of AutoMovieHumanTrunkTapes.solve. The half width at which a section's tape reads its input.
  @param tape The tape, mm.
  @param girth The tape read at a trial half width.
  @param guess A half width to start from, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The half width at which a section's tape reads its input.
 * @evidence contracts/development/design.md#principled-representation The half width at which a section's tape reads its input. The callable takes width and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkTapes.SolveGirth is the canonical exchange used by AutoMovieHumanTrunkTapes.solve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkTapes.solve for the half width at which a section's tape reads its input.
 */
  export type SolveGirth = (width: number) => number;
}
