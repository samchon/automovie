import type { IAutoMovieHumanHandWindow } from "@automovie/interface";

/**
 * The compact windows the hand's reliefs are made of: a bump that is one at its
 * centre and zero, with its first and second derivatives, at its edge.
 *
 * A relief that grows out of a skin without a seam must vanish with its slope
 * and curvature at its window's edge (`IAutoMovieLoftRelief`, rule J7 of the
 * shared seam module). The bump `(1 - x^2)^3` does: it has a triple zero at `x
 * = +-1`, so the base skin and the relief meet C2 there. Every joint swelling,
 * digital crease, fingertip pulp, nail fold and eminence of the hand uses it,
 * each with its own centre, half extent and amplitude.
 */
export namespace AutoMovieHumanHandWindow {
  /**
   * The bump `(1 - x^2)^3` of a coordinate scaled so its edge is at 1; zero
   * outside.
   *
   * @param x Coordinate over the window's half extent, so the window is `|x| <
   *   1`.
   */
  export function bump(x: number): IAutoMovieHumanHandWindow.IJet {
    if (Math.abs(x) >= 1) return { value: 0, slope: 0, curvature: 0 };
    const q: number = 1 - x * x;
    return {
      value: q ** 3,
      slope: -6 * x * q * q,
      curvature: q * (30 * x * x - 6),
    };
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

  /**
   * The fingertip pulp: the fat pad of the palmar side of the distal phalanx,
   * from the distal interphalangeal crease to the apex, in the pad's own axis
   * (origin the middle of the pad on the palmar sector, along the bone, normal
   * the palmar normal of the skin there). `L` is the distal phalanx's length,
   * `W` the section's half width and `D` its palmar depth at the pad's middle.
   * Without a separate measured window, the cap's own ellipse supplies the pad
   * volume. The half-length places a caller's added window between the distal
   * joint and apex, over the full section width.
   */
  export const PULP: IAutoMovieHumanHandWindow.IMass = {
    height: 0,
    length: 0.5,
    width: 1,
  };

  /**
   * The hypothenar eminence: the long narrow mass along the fifth metacarpal on
   * the ulnar side of the palm (Bridgman 1920, `docs/anatomy/hand.md`, Form),
   * in the fifth metacarpal's frame. `L` is the fifth metacarpal's length
   * (Reddy 2024: 0.797 of the third) and `W` and `D` the palm's half width; it
   * is lower than the thenar's mass, and meets the palmar sector at the
   * proximal palmar crease, a declared G1 seam.
   */
  export const HYPOTHENAR: IAutoMovieHumanHandWindow.IMass = {
    height: 0.18,
    length: 0.7,
    width: 0.2,
  };

  /**
   * A mass's height over the skin under it, mm.
   *
   * @param mass The mass.
   * @param size Its fixed sizes.
   * @param s Along its frame from its middle, mm.
   * @param t Across it, mm.
   * @returns The height, mm.
   */
  export function mass(
    mass: IAutoMovieHumanHandWindow.IMass,
    size: IAutoMovieHumanHandWindow.IMassSize,
    s: number,
    t: number,
  ): number {
    if (mass.height === 0) return 0;
    return (
      mass.height *
      size.depth *
      ellipse(s / (mass.length * size.length), t / (mass.width * size.width))
    );
  }
}
