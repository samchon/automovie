import { EllipticFunctions } from "./EllipticFunctions";
import { bracketedRoot } from "./bracketedRoot";

/**
 * The buckled shape of a slender rod pinned at both ends and pressed along its
 * chord, the Euler elastica in its first mode, in closed form (Timoshenko and
 * Gere 1961, Theory of Elastic Stability, §2.7, "Large deflections of buckled
 * bars"; Love 1927, A Treatise on the Mathematical Theory of Elasticity,
 * §263).
 *
 * The rod's tangent leaves each end at the slope `θ0` from its chord, and every
 * shape is fixed by the parameter `m = k^2`, `k = sin(θ0 / 2)`, with `K` and
 * `E` the complete elliptic integrals of the first and second kinds at `m`
 * (`EllipticFunctions`):
 *
 * - The chord's share of the arc: `d / L = 2 E(m) / K(m) - 1`.
 * - The tangent's angle from the chord at arc `s` from one end, toward the bow:
 *   `θ(s) = 2 arcsin(k sn(K (1 - 2 s / L) | m))`, `θ0` at that end, zero at the
 *   middle and `-θ0` at the other end.
 * - The greatest curvature, at the middle: `κ = 4 k K / L`.
 */
export namespace pinnedElastica {
  /**
   * The chord's share of the arc at a parameter.
   *
   * @param m The parameter, 0 for the straight rod, below 1.
   * @returns `d / L`.
   */
  export function chord(m: number): number {
    return (
      (2 * EllipticFunctions.secondKind(m)) /
        EllipticFunctions.firstKind(1 - m) -
      1
    );
  }

  /**
   * The parameter of the shape whose chord is a share of its arc, by a
   * bracketed root (`bracketedRoot`) of `chord(m) - ratio` over `[0, HIGHEST]`:
   * the share falls monotonically from 1 as `m` grows.
   *
   * @param ratio The chord's share of the arc, `d / L`.
   * @returns `m`; 0 for a share of 1 or more, the straight rod.
   * @throws {Error} For a share no shape up to `HIGHEST` shortens to.
   */
  export function parameter(ratio: number): number {
    if (ratio >= 1) return 0;
    const low: number = chord(HIGHEST);
    if (!(ratio > low))
      throw new Error(
        `an elastica's chord shortens to ${low} of its arc at most, not ${ratio}`,
      );
    return bracketedRoot(
      (m: number): number => chord(m) - ratio,
      0,
      HIGHEST,
      TOLERANCE,
    );
  }

  /**
   * The tangent's angle from the chord at a share of the arc.
   *
   * @param m The parameter.
   * @param share The arc from the first end over the whole, 0 to 1.
   * @returns `θ`, radians, toward the bow.
   */
  export function slope(m: number, share: number): number {
    if (m === 0) return 0;
    const K: number = EllipticFunctions.firstKind(1 - m);
    return (
      2 *
      Math.asin(
        Math.sqrt(m) * EllipticFunctions.jacobi(K * (1 - 2 * share), m).sn,
      )
    );
  }

  /**
   * The greatest curvature, at the middle.
   *
   * @param m The parameter.
   * @param length The arc, metres.
   * @returns `κ`, per metre.
   */
  export function curvature(m: number, length: number): number {
    return (4 * Math.sqrt(m) * EllipticFunctions.firstKind(1 - m)) / length;
  }

  /**
   * The greatest parameter a share is sought below: `1 - 2^-40`, where the
   * chord has passed through the rod's ends and back (`d / L` about -0.93).
   */
  export const HIGHEST: number = 1 - 2 ** -40;

  /** The parameter's tolerance in the bracketed root. */
  export const TOLERANCE: number = 1e-12;
}
