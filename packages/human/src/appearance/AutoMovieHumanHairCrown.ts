import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * The crown's whorl a crop's hair points away from.
 *
 * The whorl lies on the back midline at {@link ELEVATION} degrees, behind
 * the vertex (convention of this prototype), and the hair points away from
 * it along the scalp. A whorl turns one way, but its turning is local to it:
 * a swirl at a constant share of the outward flow turned the hair at the
 * temples as much as at the whorl, so one temple's hair rose off its
 * hairline and bared it while the other's fell, a one-sided bare patch at
 * f2's right temple. No published decay of the turning was found, so the
 * flow is the outward one alone and mirror-symmetric. How much scalp the
 * whorl shows follows the coverage law (`AutoMovieHumanHairOcclusion`), like
 * a parting.
 */
export namespace AutoMovieHumanHairCrown {
  /** Elevation of the whorl on the back midline, degrees (convention). */
  export const ELEVATION: number = 55;

  /**
   * Unnormalised flow away from the whorl.
   *
   * @param u Unit chart direction
   * @returns Flow before tangent projection
   */
  export function flow(u: [number, number, number]): [number, number, number] {
    const w: [number, number, number] = AutoMovieHumanHeadField.direction(
      Math.PI,
      (ELEVATION * Math.PI) / 180,
    );
    return [u[0] - w[0], u[1] - w[1], u[2] - w[2]];
  }
}
