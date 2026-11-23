/**
 * How a soft body touches: its thickness and its friction.
 *
 * A cord's segments are capsules of radius `thickness`, which keeps two of its
 * segments apart when `selfCollision` asks for it (a coil, a knot), and a
 * sheet's thickness is how far it may lie within a body's capsule. Friction is
 * one Coulomb coefficient for sticking and sliding, applied at a contact with a
 * collider and at a cord's contact with itself, by the position-based friction
 * of Macklin, Müller, Chentanez and Kim 2014 ("Unified particle physics for
 * real-time applications", ACM TOG 33(4):153, section 6.1): a rope round a post
 * holds while its load ratio stays under the capstan bound exp(mu theta).
 */
export interface IAutoMovieSoftContact {
  /** The cord's radius, or the sheet's half thickness, metres; positive. */
  thickness: number;

  /**
   * The Coulomb friction coefficient, dimensionless; not negative, zero for
   * frictionless.
   */
  friction: number;
}
