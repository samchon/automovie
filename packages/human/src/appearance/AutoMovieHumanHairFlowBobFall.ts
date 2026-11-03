import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The bob's back and sides: hair falls straight, `-1` down and `-0.3` back
 * (conventions of this prototype), to the level cut.
 */
export namespace AutoMovieHumanHairFlowBobFall {
  /**
   * Preferred growth direction before tangent projection.
   *
   * @returns Direction in the head chart's frame
   */
  export function direction(): AutoMovieHumanSkinVector.Vec3 {
    return [-0.3, -1, 0];
  }
}
