import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanHairRoots } from "./AutoMovieHumanHairRoots";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The level at which a bob ends: `length` below the vertex, moved by up to
 * {@link CUT} mm either way around the head (convention) by periodic value
 * noise over twelve azimuth cells, so the cut is no ruler-straight line. The
 * noise reads the azimuth's magnitude, so a root and its mirror agree.
 */
export namespace AutoMovieHumanHairCutLevel {
  /** Largest move of the cut level either way around the head, mm (convention). */
  export const CUT: number = 3;

  /**
   * Height of the level cut at a root's azimuth, model millimetres.
   *
   * @param vertex Vertex height, model millimetres
   * @param length The input's longest hair, millimetres
   * @param u Unit root direction in the head chart's frame
   * @returns Cut height, model millimetres
   */
  export function level(
    vertex: number,
    length: number,
    u: AutoMovieHumanSkinVector.Vec3,
  ): number {
    return (
      vertex -
      length -
      CUT *
        (2 *
          AutoMovieHumanAppearanceNoise.periodic1(
            15,
            AutoMovieHumanHairRoots.turn(u) * 12,
            12,
          ) -
          1)
    );
  }
}
