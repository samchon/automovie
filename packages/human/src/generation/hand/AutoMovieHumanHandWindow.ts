/**
 * The compact windows the hand's reliefs are made of: a bump that is one at
 * its centre and zero, with its first and second derivatives, at its edge.
 *
 * A relief that grows out of a skin without a seam must vanish with its
 * slope and curvature at its window's edge (`IAutoMovieHumanRelief`, rule J7
 * of the shared seam module). The bump `(1 - x^2)^3` does: it has a triple
 * zero at `x = +-1`, so the base skin and the relief meet C2 there. Every
 * joint swelling, digital crease, fingertip pulp, nail fold and eminence of
 * the hand uses it, each with its own centre, half extent and amplitude.
 */
export namespace AutoMovieHumanHandWindow {
  /** A function's value and its first and second derivatives. */
  export interface IJet {
    /** Value. */
    value: number;

    /** First derivative in the window's own coordinate. */
    slope: number;

    /** Second derivative in the window's own coordinate. */
    curvature: number;
  }

  /**
   * The bump `(1 - x^2)^3` of a coordinate scaled so its edge is at 1; zero
   * outside.
   *
   * @param x Coordinate over the window's half extent, so the window is `|x| < 1`.
   */
  export function bump(x: number): IJet {
    if (Math.abs(x) >= 1) return { value: 0, slope: 0, curvature: 0 };
    const q: number = 1 - x * x;
    return { value: q ** 3, slope: -6 * x * q * q, curvature: q * (30 * x * x - 6) };
  }

  /**
   * The elliptic bump over a plane: `(1 - u^2 - v^2)^3`, zero outside the unit
   * disc, for a mass whose footprint is an ellipse of half extents `(a, b)` in
   * `(u, v) = (s / a, t / b)`.
   *
   * @param u First coordinate over its half extent.
   * @param v Second coordinate over its half extent.
   */
  export function ellipse(u: number, v: number): number {
    const q: number = 1 - u * u - v * v;
    return q <= 0 ? 0 : q ** 3;
  }
}
