import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";

/**
 * A card's per-card shade and lean: they break the mass into bundles without
 * breaking its shading. Shade is a linear multiplier in [0.8, 1]; the tilt
 * leans the card normal sideways by up to 0.03 radian and each edge leans a
 * further {@link EDGE} outward, so a card shades like a slightly rounded
 * bundle; larger leans give each card its own highlight and the mass reads
 * as separate planks. Roots are darker than the outer length, as the hair
 * above shades them. All values are conventions of this prototype.
 */
export namespace AutoMovieHumanHairCardShade {
  /** Lean of each card edge outward, radians (convention). */
  export const EDGE: number = 0.03;

  /**
   * The card's shade multiplier.
   *
   * @param seed The root's seed, shared with its mirror
   * @returns Multiplier in [0.8, 1]
   */
  export function shade(seed: number): number {
    return 0.8 + 0.2 * AutoMovieHumanAppearanceNoise.hash(10, seed);
  }

  /**
   * The card normal's sideways tilt.
   *
   * @param seed The root's seed, shared with its mirror
   * @param hand -1 for a mirrored card, else 1
   * @returns Tilt, radians, within 0.03
   */
  export function tilt(seed: number, hand: number): number {
    return hand * 0.06 * (AutoMovieHumanAppearanceNoise.hash(11, seed) - 0.5);
  }

  /**
   * The vertex colour multiplier at a share of the length.
   *
   * @param shade The card's shade multiplier
   * @param t Arc length over the card's length
   * @returns Tone, darker over the first 30 percent
   */
  export function tone(shade: number, t: number): number {
    return shade * (0.8 + 0.2 * Math.min(1, t / 0.3));
  }

  /**
   * The lean of one card edge.
   *
   * @param tilt The card's tilt
   * @param sign -1 for the left edge, 1 for the right
   * @returns Lean, radians
   */
  export function lean(tilt: number, sign: number): number {
    return tilt + sign * EDGE;
  }
}
