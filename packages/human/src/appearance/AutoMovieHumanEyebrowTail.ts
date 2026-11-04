import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";

/**
 * The brow's tail, 20 to 25 percent of its length above the orbital margin
 * beyond the lateral canthus, centred on the brow's lateral end (Rajput 2021,
 * conventional): its hairs run horizontally and outward along the axis,
 * sloping down a few degrees (6 degrees here, a convention of this
 * prototype), and the density thins toward the end.
 */
export namespace AutoMovieHumanEyebrowTail {
  /**
   * Weight of the tail along the brow: 0 before 70 percent, 1 past 95.
   *
   * @param t Along the brow, 0 at the head, 1 at the tail
   * @returns Weight in [0, 1]
   */
  export function weight(t: number): number {
    return AutoMovieHumanEyelid.smoothstep(0.7, 0.95, t);
  }

  /**
   * Hair direction from the brow axis toward the temple, degrees.
   *
   * @returns Degrees, a few below the axis
   */
  export function degrees(): number {
    return -6;
  }

  /**
   * Density thinning along the tail: 0.4 at the very end.
   *
   * @param t Along the brow
   * @returns Factor in [0.4, 1]
   */
  export function thin(t: number): number {
    return 1 - 0.6 * AutoMovieHumanEyelid.smoothstep(0.55, 1, t);
  }
}
