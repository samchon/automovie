import { AutoMovieHumanTrunkFeatureProfile } from "./AutoMovieHumanTrunkFeatureProfile";

/**
 * The umbilicus's profile, the pit's side curve alone: a depth over the wall
 * against the normalised distance from the pit's centre, `(1 - rho^2)^3` with
 * its rim flat to the second derivative, so the pit is its own piece with a
 * C2 edge.
 */
export namespace AutoMovieHumanUmbilicalProfile {
  /**
   * Depth of the pit at its centre, mm. Conventional, flagged: the former
   * trunk's navel was 6 mm deep; no published depth is on the record.
   */
  export const DEPTH: number = 5;

  /**
   * Radius of the pit's footprint, mm. Conventional, flagged: the former
   * trunk's navel had a half width of 11 mm.
   */
  export const RADIUS: number = 12;

  /**
   * The profile's height at a normalised radius.
   *
   * @param rho Normalised distance from the pit's centre, 1 at the rim.
   * @returns The height over the wall, mm; negative (a pit).
   */
  export function height(rho: number): number {
    return -DEPTH * AutoMovieHumanTrunkFeatureProfile.bump(rho);
  }
}
