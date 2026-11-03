import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The short cut's back and sides: combed down and slightly back, `-1` of it
 * down and `-0.4` back (conventions of this prototype), tapering to a third
 * of the length at the nape and sides (`AutoMovieHumanHairStrandBase`).
 */
export namespace AutoMovieHumanHairFlowShortRest {
  /**
   * Preferred growth direction before tangent projection.
   *
   * @returns Direction in the head chart's frame
   */
  export function direction(): AutoMovieHumanSkinVector.Vec3 {
    return [-0.4, -1, 0];
  }
}
