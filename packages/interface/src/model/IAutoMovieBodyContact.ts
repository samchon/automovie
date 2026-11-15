/**
 * How a body in flight ends against what it strikes, beyond its restitution: how deep it sticks, how it rolls on, and how much speed it loses passing through a body.
 *
 * Rough numbers, as everywhere in `interface`: units and ranges live here in the JSDoc and are enforced at runtime by `@automovie/engine`, not by the type.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is, its unit and range, and that an unmeasured one is absent.
 * @evidence contracts/development/design.md#principled-representation Three independent optional quantities, each present only for the outcomes its body has: a depth in metres, a dimensionless rolling-resistance coefficient and a share of speed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the interface as a body's optional flight datum (#3482), written by the projectile producers and read by a flight's outcome (#3479).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unmeasured quantity is absent, never a placeholder.
 */
export interface IAutoMovieBodyContact {
  /** How deep the body goes into what it sticks in, metres, at least 0; absent for a body that does not stick or whose depth no source measured. */
  embed?: number;

  /** The rolling-resistance coefficient on the ground, the resisting force over the weight, `0` to `1`; absent for a body that does not roll or whose resistance no source measured. */
  rolling?: number;

  /** The share of its speed the body loses passing through one body, `0` to `1`; absent for a body that does not pass through or whose loss no source measured. */
  passLoss?: number;
}
