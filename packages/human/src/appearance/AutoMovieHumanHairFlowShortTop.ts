import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The short cut's top and front: combed back from its side parting, toward
 * the side the parting's ramp gives (`AutoMovieHumanHairParting.side`). The
 * direction is `-X` (back) with a lateral part of 0.7 of it toward the side
 * (conventions of this prototype); the front of the head, temples included,
 * is combed back like the top rather than down over the forehead.
 */
export namespace AutoMovieHumanHairFlowShortTop {
  /**
   * Preferred growth direction before tangent projection.
   *
   * @param side Side of the parting, -1 to 1
   * @returns Direction in the head chart's frame
   */
  export function direction(side: number): AutoMovieHumanSkinVector.Vec3 {
    return [-1, 0, 0.7 * side];
  }
}
