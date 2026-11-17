/** Type contracts exchanged by AutoMovieHumanHeadMath; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadMath {
  /** A point of a section.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A point of a section.
   * @evidence contracts/development/design.md#principled-representation A point of a section. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadMath.mix, AutoMovieHumanHeadMath.centroid. Read by AutoMovieHumanHeadMath.mix, AutoMovieHumanHeadMath.centroid, AutoMovieHumanHeadMath.lifted.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadMath.mix, AutoMovieHumanHeadMath.centroid, AutoMovieHumanHeadMath.lifted for a point of a section.
   */
  export type P2 = [number, number];

  /** The h argument of AutoMovieHumanHeadMath.outermost. Outermost root of `h(r) = 1` along a ray, for `h` the convex gauge of a
  convex body: one bisection when the ray starts inside, else from the body's
  nearest approach; nothing when the ray misses it.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Outermost root of `h(r) = 1` along a ray, for `h` the convex gauge of a convex body: one bisection when the ray starts inside, else from the body's nearest approach; nothing when the ray misses it.
 * @evidence contracts/development/design.md#principled-representation Outermost root of `h(r) = 1` along a ray, for `h` the convex gauge of a convex body: one bisection when the ray starts inside, else from the body's nearest approach; nothing when the ray misses it. The callable takes r and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadMath.OutermostH is the canonical exchange used by AutoMovieHumanHeadMath.outermost.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadMath.outermost for outermost root of `h(r) = 1` along a ray, for `h` the convex gauge of a convex body: one bisection when the ray starts inside, else from the body's nearest approach; nothing when the ray misses it.
 */
  export type OutermostH = (r: number) => number;
}
