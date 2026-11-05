import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";

/**
 * The brow's head, the first fifth beside the nose, centred on the medial
 * canthus: below the orbital margin, one or two staggered rows of sparse
 * hair (Rajput 2021, conventional), so its density fades in over the first
 * fifth and rises to a third of the brow. The thresholds are conventions of
 * this prototype inside Rajput's description.
 */
export namespace AutoMovieHumanEyebrowHead {
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
