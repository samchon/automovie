import { AutoMovieHumanTrunkFeatureProfile } from "./AutoMovieHumanTrunkFeatureProfile";

/**
 * The sternal notch's profile, the pit's side curve alone: a depth over the
 * wall against the normalised distance from the notch's centre over a
 * footprint of two half ellipses, `(1 - rho^2)^3` with its rim flat to the
 * second derivative, so the notch is its own piece with a C2 edge.
 *
 * The jugular notch is the hollow over the manubrium's upper border between
 * the sternal heads of the two sternocleidomastoids (Gray 1918); its floor is
 * the notch, its sides the muscles' heads, so it is wider than tall and
 * reaches further down over the manubrium than up toward the neck.
 */
export namespace AutoMovieHumanSternalNotchProfile {
  /**
   * Depth of the hollow at its centre, mm. Conventional, flagged: no
   * published skin depth of the jugular notch is on the record.
   */
  export const DEPTH: number = 4;

  /**
   * Lateral half width of the footprint, mm: about half the gap between the
   * sternal heads of the sternocleidomastoids. Conventional, flagged.
   */
  export const HALF: number = 14;

  /** Reach below the centre over the manubrium, mm. Conventional, flagged. */
  export const LOWER: number = 12;

  /** Reach above the centre toward the neck, mm. Conventional, flagged. */
  export const UPPER: number = 6;

  /**
   * The profile's height at a place of the footprint.
   *
   * @param u Lateral place from the centre, mm.
   * @param v Place along up from the centre, mm.
   * @returns The height over the wall, mm; negative (a hollow).
   */
  export function height(u: number, v: number): number {
    return -DEPTH * AutoMovieHumanTrunkFeatureProfile.bump(AutoMovieHumanTrunkFeatureProfile.rho(u, v, HALF, LOWER, UPPER));
  }
}
