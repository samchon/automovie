import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The bob's comb in front of the back of the head: away from its midline
 * parting over the top, along the coronal circle through the root, which is
 * what a parting is (the line the hair is combed away from). At a unit chart
 * direction `(x, y, z)` the direction is `(0, -|z|, side y) / hypot(y, z)`:
 * lateral beside the line, downward at the side's equator and inward under
 * it, never upward. The tangent projection (`AutoMovieHumanHairFlow.tangent`)
 * lays it on the scalp, and gravity bends the strand as it grows
 * (`AutoMovieHumanHairGuideStep`), so the hair beside the parting runs along
 * the frontal line and down over the temples, over the hair-bearing band
 * under the bell's dome. A backward and a downward part added to the lateral
 * one lifted that hair over the vault and bared the band, the bare forehead
 * wedge beside the parting; the plain lateral `side * Z` points upward below
 * the equator.
 */
export namespace AutoMovieHumanHairFlowBobSweep {
  /**
   * Preferred growth direction before tangent projection.
   *
   * @param u Unit chart direction
   * @param side Side of the parting, -1 to 1
   * @returns Direction in the head chart's frame
   */
  export function direction(
    u: AutoMovieHumanSkinVector.Vec3,
    side: number,
  ): AutoMovieHumanSkinVector.Vec3 {
    const coronal: number = Math.hypot(u[1], u[2]);

    // On the sagittal axis the coronal circle degenerates: the hair falls.
    if (!(coronal > 0)) return [0, -1, 0];
    return [0, -Math.abs(u[2]) / coronal, (side * u[1]) / coronal];
  }
}
