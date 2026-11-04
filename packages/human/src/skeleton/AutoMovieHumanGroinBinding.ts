import { AutoMovieHumanSkinStep } from "./AutoMovieHumanSkinStep";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The groin region: where a leg's skin meets the pelvis across the midline.
 *
 * Above the crotch the two sides are one skin, which the midline holds, so a
 * leg's share falls to nothing at the midline over the half pelvis, from the
 * midline to the hip's centre: any narrower band shears the groin under the
 * thigh's turn. Below the crotch the legs are apart
 * ({@link AutoMovieHumanCrotchBinding}).
 */
export namespace AutoMovieHumanGroinBinding {
  /**
   * The fall's width: the hip centre's distance from the midline.
   *
   * @param hip The hip's centre, metres.
   * @returns The half pelvis, metres.
   */
  export function width(hip: Math3D.Vector): number {
    return Math.abs(hip[2]);
  }

  /**
   * How much of a leg's share the midline takes back.
   *
   * @param away The point's distance from the midline on the leg's side, metres.
   * @param width The fall's width, the hip centre's distance from the midline.
   * @returns 1 on the midline, 0 at the hip's centre and beyond.
   */
  export function inside(away: number, width: number): number {
    return 1 - AutoMovieHumanSkinStep.glide(away / width);
  }
}
