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
 * about the root over EI, for a horizontal moment arm l cos(theta0) / 2).
 * The fibre bends at that curvature: its angle over the scalp is
 * `theta0 - kappa0 s`, so it rises to its apex `(1 - cos theta0) / kappa0`
 * at `s = theta0 / kappa0` and comes down again onto the hair under it at
 * `s = 2 theta0 / kappa0`, after which it lies on the mass (the height over
 * the scalp is `(cos(theta0 - kappa0 s) - cos theta0) / kappa0` up to the
 * landing, zero after it). Hair much shorter than lambda stands straight in
 * its exit direction; hair much longer lands within millimetres of its root.
 * Keeping the curvature at its root value is a first-order closure of the
 * elastica (the moment of the remaining length falls along the fibre, so the
 * true fibre lands somewhat later); the length scale is derived. A closure
 * that relaxed the angle toward the surface and kept the height reached let
 * every strand beside a parting ride 14 mm over the mass for its whole length,
 * a crest of card edges along the parting and a shell of cards apart from the
 * rest at the silhouette.
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
    // The root curvature; a fibre too short to bend stands straight.
    const curvature: number =
      (strand * strand * Math.cos(exit)) / (2 * bending ** 3);
    if (!(curvature > 0)) return Math.sin(exit) * s;

    // The arc's turn up to the landing, then the height of the circular arc,
    // written as 2 sin(theta0 - x / 2) sin(x / 2) / kappa so that a small
    // curvature keeps its precision.
    const turn: number = Math.min(curvature * s, 2 * exit);
    return (2 * Math.sin(exit - turn / 2) * Math.sin(turn / 2)) / curvature;
  }
}
