import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";

/**
 * The brow's head, the first fifth beside the nose, centred on the medial
 * canthus: below the orbital margin, one or two staggered rows (Rajput 2021,
 * conventional). Its hairs are sparse and fade in over the first fifth,
 * point up and out (40 to 70 degrees from the lower to the upper border,
 * fanning), and are shorter. The thresholds and angles are conventions of
 * this prototype inside Rajput's description.
 */
export namespace AutoMovieHumanEyebrowHead {
  /**
   * Weight of the head along the brow: 1 at the start, 0 past a fifth.
   *
   * @param t Along the brow, 0 at the head, 1 at the tail
   * @returns Weight in [0, 1]
   */
  export function weight(t: number): number {
    return 1 - AutoMovieHumanEyelid.smoothstep(0.06, 0.2, t);
  }

  /**
   * Hair direction from the brow axis toward the temple, degrees.
   *
   * @param v Across the brow, -1 at the lower border, +1 at the upper
   * @returns Degrees, 40 to 70
   */
  export function degrees(v: number): number {
    return 55 + 15 * v;
  }

  /**
   * Spread of the hair direction, degrees: wider in the head.
   *
   * @param head The head's weight
   * @returns Spread, degrees
   */
  export function scatter(head: number): number {
    return 10 + 12 * head;
  }

  /**
   * Hair length factor: head hairs are shorter.
   *
   * @param head The head's weight
   * @returns Factor in [0.65, 1]
   */
  export function shorten(head: number): number {
    return 1 - 0.35 * head;
  }

  /**
   * Density fade-in over the first fifth.
   *
   * @param t Along the brow
   * @returns Factor in [0, 1]
   */
  export function fadeIn(t: number): number {
    return AutoMovieHumanEyelid.smoothstep(-0.04, 0.22, t);
  }

  /**
   * Density rise from the start to a third of the brow.
   *
   * @param t Along the brow
   * @returns Factor in [0.45, 1]
   */
  export function rise(t: number): number {
    return 0.45 + 0.55 * AutoMovieHumanEyelid.smoothstep(0, 0.3, t);
  }
}
