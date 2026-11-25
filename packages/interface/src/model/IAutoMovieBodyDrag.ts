/**
 * The air's resistance to a body in flight: the drag force is `0.5 rho v^2 Cd
 * A`, with the air's density `rho`, the speed `v`, this coefficient `Cd` and
 * this reference area `A`.
 *
 * Rough numbers, as everywhere in `interface`: units and ranges live here in
 * the JSDoc and are enforced at runtime by `@automovie/engine`, not by the
 * type.
 */
export interface IAutoMovieBodyDrag {
  /** The drag coefficient, dimensionless, positive. */
  coefficient: number;

  /**
   * The reference area the coefficient is stated against, square metres,
   * positive: a sphere's cross-section, or the area its source names.
   */
  area: number;
}
