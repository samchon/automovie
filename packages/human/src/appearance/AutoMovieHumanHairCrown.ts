import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * The crown's whorl a crop's hair points away from.
 *
 * The whorl lies on the back midline at {@link ELEVATION} degrees, behind
 * the vertex, and the hair turns about it by a swirl of {@link SWIRL} of
 * the outward strength in one turning sense, the crop's declared break of
 * the head's mirror symmetry (a whorl turns one way). Both are conventions
 * of this prototype. How much scalp the whorl shows follows the coverage
 * law (`AutoMovieHumanHairOcclusion`), like a parting.
 */
export namespace AutoMovieHumanHairCrown {
  /** Elevation of the whorl on the back midline, degrees (convention). */
  export const ELEVATION: number = 55;

  /** Swirl strength over the outward flow (convention). */
  export const SWIRL: number = 0.35;

  /**
   * Unnormalised flow away from the whorl with its swirl.
   *
   * @param u Unit chart direction
   * @returns Flow before tangent projection
   */
  export function flow(u: [number, number, number]): [number, number, number] {
    const w: [number, number, number] = AutoMovieHumanHeadField.direction(
      Math.PI,
      (ELEVATION * Math.PI) / 180,
    );
    const swirl: [number, number, number] = [
      w[1] * u[2] - w[2] * u[1],
      w[2] * u[0] - w[0] * u[2],
      w[0] * u[1] - w[1] * u[0],
    ];
    return [
      u[0] - w[0] + SWIRL * swirl[0],
      u[1] - w[1] + SWIRL * swirl[1],
      u[2] - w[2] + SWIRL * swirl[2],
    ];
  }
}
