import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";

/**
 * The brow's tail, 20 to 25 percent of its length above the orbital margin
 * beyond the lateral canthus, centred on the brow's lateral end (Rajput 2021,
 * conventional): its density thins toward the end.
 */
export namespace AutoMovieHumanEyebrowTail {
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
