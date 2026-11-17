/**
 * How a soft body touches: its thickness and its friction.
 *
 * A cord's segments are capsules of radius `thickness`, which keeps two of
 * its segments apart when `selfCollision` asks for it (a coil, a knot), and a
 * sheet's thickness is how far it may lie within a body's capsule. Friction
 * is one Coulomb coefficient for sticking and sliding, applied at a contact
 * with a collider and at a cord's contact with itself, by the position-based
 * friction of Macklin, Müller, Chentanez and Kim 2014 ("Unified particle
 * physics for real-time applications", ACM TOG 33(4):153, section 6.1): a
 * rope round a post holds while its load ratio stays under the capstan bound
 * exp(mu theta).
 *
 * @evidence contracts/development/design.md#principled-representation A radius in metres and a dimensionless Coulomb coefficient.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two quantities self-contact and friction read; a domain without it keeps the frictionless, self-contact-free solve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One coefficient rather than separate static and kinetic ones, the model the cited friction uses with both equal; positivity is the engine validator's to enforce.
 * @evidence contracts/development/common.md#meaningful-documentation States the units, what each member governs and the friction model's source.
 */
export interface IAutoMovieSoftContact {
  /** The cord's radius, or the sheet's half thickness, metres; positive. */
  thickness: number;

  /** The Coulomb friction coefficient, dimensionless; not negative, zero for frictionless. */
  friction: number;
}
