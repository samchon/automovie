/**
 * How a body in flight ends against what it strikes, beyond its restitution:
 * how deep it sticks, how it rolls on, how its spin grips a surface it bounces
 * on, how much speed it loses passing through a body, the energy of a hit that
 * breaks it, and the angle beyond which a projectile glances off it.
 *
 * Rough numbers, as everywhere in `interface`: units and ranges live here in
 * the JSDoc and are enforced at runtime by `@automovie/engine`, not by the
 * type.
 */
export interface IAutoMovieBodyContact {
  /**
   * How deep the body goes into what it sticks in, metres, at least 0; absent
   * for a body that does not stick or whose depth no source measured.
   */
  embed?: number;

  /**
   * The rolling-resistance coefficient on the ground, the resisting force over
   * the weight, `0` to `1`; absent for a body that does not roll or whose
   * resistance no source measured.
   */
  rolling?: number;

  /**
   * A round body's moment of inertia about a diameter over its mass times its
   * radius squared, above 0 and no more than 2/3, which a ball reaches with all
   * its mass at its radius: 2/5 for a uniform solid ball, 2/3 for a thin hollow
   * shell such as an inflated ball. It decides how much of a bounce's sliding
   * the ball's spin takes up, so a gripping bounce keeps `1 / (1 + gyration)`
   * of the speed along the surface. Absent when no source gives it; a ball's
   * bounce then reads a uniform solid's 2/5, the uniform density an undeclared
   * mass distribution is taken to have.
   */
  gyration?: number;

  /**
   * The share of its speed the body loses passing through one body, `0` to `1`;
   * absent for a body that does not pass through or whose loss no source
   * measured.
   */
  passLoss?: number;

  /**
   * The energy, joules, at or above which a hit breaks the body into its
   * declared fragments; absent for a body that does not break or whose
   * threshold no source measured.
   */
  fracture?: number;

  /**
   * The angle from the body's surface normal, degrees, `0` to `90`, beyond
   * which a projectile striking the body glances off it at the body's
   * restitution instead of sticking in or passing through it, as an arrow
   * glances from plate armour; absent for a body nothing glances from or whose
   * angle no source measured.
   */
  glance?: number;
}
