/**
 * How a body in flight ends against what it strikes, beyond its restitution: how deep it sticks, how it rolls on, how much speed it loses passing through a body, the energy of a hit that breaks it, and the angle beyond which a projectile glances off it.
 *
 * Rough numbers, as everywhere in `interface`: units and ranges live here in the JSDoc and are enforced at runtime by `@automovie/engine`, not by the type.
 */
export interface IAutoMovieBodyContact {
  /** How deep the body goes into what it sticks in, metres, at least 0; absent for a body that does not stick or whose depth no source measured. */
  embed?: number;

  /** The rolling-resistance coefficient on the ground, the resisting force over the weight, `0` to `1`; absent for a body that does not roll or whose resistance no source measured. */
  rolling?: number;

  /** The share of its speed the body loses passing through one body, `0` to `1`; absent for a body that does not pass through or whose loss no source measured. */
  passLoss?: number;

  /** The energy, joules, at or above which a hit breaks the body into its declared fragments; absent for a body that does not break or whose threshold no source measured. */
  fracture?: number;

  /** The angle from the body's surface normal, degrees, `0` to `90`, beyond which a projectile striking the body glances off it at the body's restitution instead of sticking in or passing through it, as an arrow glances from plate armour; absent for a body nothing glances from or whose angle no source measured. */
  glance?: number;
}
