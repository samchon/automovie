/**
 * How far a hair fibre stands off the scalp before gravity bends it down: the
 * cantilever of a single fibre clamped at its exit angle.
 *
 * A fibre of Young's modulus E and diameter d has the bending stiffness
 * EI = E pi d^4 / 64 and, at density rho, the weight per length
 * w = rho g pi d^2 / 4. Their ratio sets one length, the gravitational
 * bending length `lambda = (EI / w)^(1/3) = (E d^2 / (16 rho g))^(1/3)`,
 * about 50 mm for human hair. A fibre of length l clamped at the angle
 * theta0 over the horizontal is bent at its root with the curvature
 * `kappa0 = l^2 cos(theta0) / (2 lambda^3)` (the moment of its own weight
 * about the root over EI, for a horizontal moment arm l cos(theta0) / 2);
 * the angle relaxes from theta0 at that rate, so over the decay length
 * `theta0 / kappa0` it is bent flat: hair much shorter than lambda stands
 * straight in its exit direction, hair much longer falls within millimetres
 * of its root. The standing height at an arc length s is the integral of
 * `sin(theta0 exp(-s / decay))`, taken with `sin(theta0)` constant over the
 * relaxation (a first-order closure of the elastica, whose form is a
 * convention; its length scale is derived).
 *
 * Young's modulus (about 4 GPa, dry human hair, tensile tests) and the
 * density (1.32 g per cm3) are values relayed from the hair-science
 * literature (Robbins, Chemical and Physical Behavior of Human Hair), not
 * read here; the diameter is `AutoMovieHumanHairOcclusion.DIAMETER`.
 */
export namespace AutoMovieHumanHairBending {
  /** Young's modulus of a human hair fibre, pascal (relayed measurement). */
  export const MODULUS: number = 4e9;

  /** Density of a human hair fibre, kilograms per cubic metre (relayed measurement). */
  export const DENSITY: number = 1320;

  /** Gravitational acceleration, metres per second squared. */
  export const GRAVITY: number = 9.80665;

  /**
   * The gravitational bending length for a fibre diameter, millimetres.
   *
   * @param diameter Fibre diameter, millimetres
   * @returns Bending length, millimetres
   */
  export function length(diameter: number): number {
    const d: number = diameter / 1000;
    return 1000 * ((MODULUS * d * d) / (16 * DENSITY * GRAVITY)) ** (1 / 3);
  }

  /**
   * Height a strand stands off the scalp along its normal after an arc.
   *
   * @param exit Exit angle over the scalp, radians
   * @param strand The strand's length, millimetres
   * @param bending The bending length, millimetres
   * @param s Arc grown, millimetres
   * @returns Height over the scalp, millimetres
   */
  export function rise(
    exit: number,
    strand: number,
    bending: number,
    s: number,
  ): number {
    // The decay length of the exit angle, from the root curvature.
    const curvature: number =
      (strand * strand * Math.cos(exit)) / (2 * bending ** 3);
    const decay: number = exit / Math.max(curvature, 1e-9);
    return Math.sin(exit) * decay * (1 - Math.exp(-s / decay));
  }
}
