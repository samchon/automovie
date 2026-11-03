import { AutoMovieHumanTrunkFeatureProfile } from "./AutoMovieHumanTrunkFeatureProfile";

/**
 * The gluteal mass's profile, the side curve alone: its height over the
 * pelvic wall against the normalised distance from the buttock point, with
 * the same rounded apex and flat rim as the other features
 * (`AutoMovieHumanTrunkFeatureProfile.bump`).
 *
 * Under the buttock's crest the rear falls as the square of the height (the
 * fall over 100 mm stands 2.78 times that over 60 mm, and (100/60)^2 is 2.78,
 * measured over 52 people, generalization.md Trunk); the bump's fall near the
 * rim is that square law's smooth form: `(1 - rho^2)^3` falls as `rho^2` from
 * the centre. The projection is what the base's section lacks at the
 * buttock point for the buttock's depth over the hip breadth (ANSUR II).
 */
export namespace AutoMovieHumanGlutealProfile {
  /**
   * The profile's height at a normalised radius.
   *
   * @param rho Normalised distance from the footprint's centre, 1 at the rim.
   * @param projection The buttock point's projection, mm.
   * @returns The height over the wall, mm.
   */
  export function height(rho: number, projection: number): number {
    return projection * AutoMovieHumanTrunkFeatureProfile.bump(rho);
  }
}
