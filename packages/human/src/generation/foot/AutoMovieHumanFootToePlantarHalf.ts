import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The plantar half of a toe's section, the pad side: two quintic pieces from
 * the lateral side point to the plantar point and from the plantar point to the
 * medial side point. Each point's jet owns its tangent and curvature
 * (`AutoMovieHumanFootJunction`), so the half meets the dorsal half G2 at the
 * side points. Own axes: the toe's own, across its line, the pad's plane being
 * the plantar point's tangent.
 */
export namespace AutoMovieHumanFootToePlantarHalf {
  /** The two pieces of the plantar half. */
  export interface IHalf {
    /** From the lateral side point to the plantar point. */
    lateral: G.Vec2[];

    /** From the plantar point to the medial side point. */
    medial: G.Vec2[];
  }

  /**
   * The plantar half between three jets.
   *
   * @param lateral The lateral side point's jet.
   * @param plantar The plantar point's jet.
   * @param medial The medial side point's jet.
   * @param count Points of each piece before resampling.
   */
  export function of(
    lateral: AutoMovieHumanFootArc.IJet,
    plantar: AutoMovieHumanFootArc.IJet,
    medial: AutoMovieHumanFootArc.IJet,
    count: number,
  ): IHalf {
    return {
      lateral: AutoMovieHumanFootArc.quintic(lateral, plantar, count),
      medial: AutoMovieHumanFootArc.quintic(plantar, medial, count),
    };
  }
}
