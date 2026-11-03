import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The bob's top: swept down to either side of its midline parting and back.
 * The front of the head sweeps back as well as aside, so the roots at the
 * front of the parting lie over the temples; swept only aside and down,
 * twelve of f1's strands fell across the forehead. The backward part is
 * `-0.15` plus `0.6` of the front weight, the downward part `-0.4`, the
 * lateral part the parting's side (conventions of this prototype).
 */
export namespace AutoMovieHumanHairFlowBobSweep {
  /**
   * Preferred growth direction before tangent projection.
   *
   * @param front Weight of the face side, 0 to 1
   * @param side Side of the parting, -1 to 1
   * @returns Direction in the head chart's frame
   */
  export function direction(
    front: number,
    side: number,
  ): AutoMovieHumanSkinVector.Vec3 {
    return [-0.15 - 0.6 * front, -0.4, side];
  }
}
