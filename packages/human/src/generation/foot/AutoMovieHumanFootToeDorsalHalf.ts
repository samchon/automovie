import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The dorsal half of a toe's section, the nail side: two quintic pieces from
 * the dorsal point to the lateral side point and from the medial side point
 * back to the dorsal point. Each point's jet owns its tangent and curvature
 * (`AutoMovieHumanFootJunction`), so the half meets the plantar half G2 at the
 * side points, the section's tightest turn. Own axes: the toe's own, across
 * its line, the nail's plane being the dorsal point's tangent.
 */
export namespace AutoMovieHumanFootToeDorsalHalf {
  /** The two pieces of the dorsal half. */
  export interface IHalf {
    /** From the dorsal point to the lateral side point. */
    lateral: G.Vec2[];

    /** From the medial side point to the dorsal point. */
    medial: G.Vec2[];
  }

  /**
   * The dorsal half between three jets.
   *
   * @param dorsal The dorsal point's jet.
   * @param lateral The lateral side point's jet.
   * @param medial The medial side point's jet.
   * @param count Points of each piece before resampling.
   */
  export function of(
    dorsal: AutoMovieHumanFootArc.IJet,
    lateral: AutoMovieHumanFootArc.IJet,
    medial: AutoMovieHumanFootArc.IJet,
    count: number,
  ): IHalf {
    return {
      lateral: AutoMovieHumanFootArc.quintic(dorsal, lateral, count),
      medial: AutoMovieHumanFootArc.quintic(medial, dorsal, count),
    };
  }
}
