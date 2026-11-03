import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanHairRoots } from "./AutoMovieHumanHairRoots";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The variation of hair length between neighbouring locks: up to 6 percent
 * either way (convention), smooth value noise over the root's chart angles,
 * twelve cells around the head and six over the elevation, so the ends never
 * line up along one cut and neighbouring cards end together instead of in a
 * saw edge. A per-root jitter made every card end at its own height, a saw
 * edge along a bob's line. The noise reads the azimuth's magnitude
 * (`AutoMovieHumanHairRoots.turn`), so a root and its mirror draw the same
 * value.
 */
export namespace AutoMovieHumanHairStrandLocks {
  /** Largest variation either way, as a share of the length (convention). */
  export const SPREAD: number = 0.06;

  /**
   * The length factor of one root.
   *
   * @param u Unit root direction in the head chart's frame
   * @returns Factor about 1, within 1 plus or minus {@link SPREAD}
   */
  export function vary(u: AutoMovieHumanSkinVector.Vec3): number {
    return (
      1 +
      2 *
        SPREAD *
        (AutoMovieHumanAppearanceNoise.value2(
          13,
          AutoMovieHumanHairRoots.turn(u) * 12,
          (Math.asin(Math.max(-1, Math.min(1, u[1]))) / Math.PI) * 6,
          12,
        ) -
          0.5)
    );
  }
}
