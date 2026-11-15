/**
 * The air's resistance to a body in flight: the drag force is `0.5 rho v^2 Cd A`, with the air's density `rho`, the speed `v`, this coefficient `Cd` and this reference area `A`.
 *
 * Rough numbers, as everywhere in `interface`: units and ranges live here in the JSDoc and are enforced at runtime by `@automovie/engine`, not by the type.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the drag law the two numbers enter and each member's unit.
 * @evidence contracts/development/design.md#principled-representation A dimensionless coefficient and the area in square metres it is stated against, the pair a measured drag is always given as; the two travel together because a coefficient means nothing without its area.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the interface as a body's optional flight datum (#3482), written by the projectile producers and read by a flight (#3479).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape names a default coefficient: a body whose drag no source measured carries none.
 */
export interface IAutoMovieBodyDrag {
  /** The drag coefficient, dimensionless, positive. */
  coefficient: number;

  /** The reference area the coefficient is stated against, square metres, positive: a sphere's cross-section, or the area its source names. */
  area: number;
}
