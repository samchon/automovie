import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanTrunkComposedSection } from "./AutoMovieHumanTrunkComposedSection";

/**
 * Skin length along a midline outline of S00 between two heights below the
 * neck turn, the reading of ANSUR II's crotch length at omphalion (from the
 * navel down the front midline, through the crotch, up the back midline to
 * the navel's level) and of its posterior part.
 *
 * Below the turn the sections are level and their axis is vertical, so the
 * outline's station is the height and the midline is the world curve `(xs +
 * x(y), y)`: its length is the integral of `sqrt(1 + x'(y)^2) dy`, by
 * composite four-point Gauss-Legendre quadrature over 64 equal spans (exact
 * for polynomials of degree 7 per span; the quintic outline's integrand is
 * smooth).
 */
export namespace AutoMovieHumanTrunkMidlineLength {
  /** Length of the outline between heights `y0 < y1`, mm. */
  export function between(scalar: AutoMovieHumanTrunkComposedSection.IScalar, y0: number, y1: number): number {
    const spans: number = 64;
    const h: number = (y1 - y0) / spans;
    let total: number = 0;
    for (let i: number = 0; i < spans; ++i)
      for (let g: number = 0; g < 4; ++g) {
        const y: number = y0 + h * (i + (NODES[g]! + 1) / 2);
        const slope: number = AutoMovieHumanFairOutline.evaluate(scalar.q, scalar.jets, scalar.at(y))[1];
        total += (h / 2) * WEIGHTS[g]! * Math.hypot(1, slope);
      }
    return total;
  }

  /** Four-point Gauss-Legendre nodes on [-1, 1]. */
  const NODES: readonly number[] = [-0.8611363115940526, -0.3399810435848563, 0.3399810435848563, 0.8611363115940526];

  /** Four-point Gauss-Legendre weights. */
  const WEIGHTS: readonly number[] = [0.3478548451374538, 0.6521451548625461, 0.6521451548625461, 0.3478548451374538];
}
