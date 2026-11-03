import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanHairOcclusion } from "./AutoMovieHumanHairOcclusion";

/**
 * The hairline's transition zone: the band above the scalp boundary where
 * hair thins out to the bare skin.
 *
 * Its width is {@link WIDTH} mm (Jung and Yun 2014: a transition zone of
 * about 1 cm of single hairs at 50 to 60 per cm2 before the full density). A
 * root's place in it is its feather, 0 at the boundary to 1 at the zone's
 * inner edge (a smoothstep of the root's height over the boundary). At the
 * edge a root's bundle holds {@link EDGE} of the full density, the zone's 55
 * per cm2 over the mean scalp density (`AutoMovieHumanHairOcclusion`), and
 * its card is as much narrower; its hair is as much shorter as its feather,
 * so the edge breaks into fine short hair. Each root's own boundary is
 * raised by up to {@link JITTER} of the zone, so the edge is no comb of
 * roots along one line; the jitter only raises, since lowering it grew hair
 * below the sideburns, a dark strip in front of each ear.
 */
export namespace AutoMovieHumanHairFeather {
  /** Width of the transition zone, mm (Jung and Yun 2014, measured on patients). */
  export const WIDTH: number = 10;

  /** Share of the full density at the boundary (55 of 152.8 hairs per cm2, derived). */
  export const EDGE: number = 0.55 / AutoMovieHumanHairOcclusion.DENSITY;

  /**
   * Largest raise of a root's own boundary, as a share of the zone
   * (convention: breaks the edge into a fringe instead of a comb along one
   * line; no published value).
   */
  export const JITTER: number = 0.4;

  /**
   * A root's feather from its height over its own raised boundary.
   *
   * @param margin Height of the root over the scalp boundary, mm
   * @param seed The root's seed, shared with its mirror
   * @returns Feather in [0, 1], or -1 below its own boundary
   */
  export function feather(margin: number, seed: number): number {
    const raised: number =
      margin - JITTER * WIDTH * AutoMovieHumanAppearanceNoise.hash(14, seed);
    if (raised <= 0) return -1;
    return AutoMovieHumanAppearanceNoise.smoothstep(0, WIDTH, raised);
  }

  /**
   * Share of the full bundle, and of the full card width, at a feather.
   *
   * @param feather The root's feather
   * @returns Share in [EDGE, 1]
   */
  export function share(feather: number): number {
    return EDGE + (1 - EDGE) * feather;
  }
}
