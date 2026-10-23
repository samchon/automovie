import { AutoMovieHumanHairColor } from "../typings/AutoMovieHumanHairColor";

/**
 * Linear base colour of each hair colour category, shared by scalp hair,
 * brows and lashes.
 *
 * The categories are closed choices defined by eumelanin and pheomelanin
 * amount, not measured concentrations, so each maps to one representative
 * sRGB colour (artistic convention, ordered from black through brown and
 * blond, with auburn and red increasingly pheomelanic and gray and white
 * unpigmented). Strand images carry only luminance and coverage; the
 * material multiplies them by this colour, so one strand image serves
 * every colour.
 */
export namespace AutoMovieHumanHairShade {
  /**
   * Linear RGB of a hair colour category.
   *
   * @param color Hair colour category
   * @returns Linear RGB in `[0, 1]`
   */
  export function linear(
    color: AutoMovieHumanHairColor,
  ): [number, number, number] {
    const srgb: [number, number, number] = SRGB[color];
    return srgb.map((c: number): number => {
      const v: number = c / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
  }
}

/** Representative sRGB 8-bit colour per category. */
const SRGB: Record<AutoMovieHumanHairColor, [number, number, number]> = {
  [AutoMovieHumanHairColor.Black]: [34, 29, 27],
  [AutoMovieHumanHairColor.DarkBrown]: [66, 47, 35],
  [AutoMovieHumanHairColor.Brown]: [104, 73, 50],
  [AutoMovieHumanHairColor.LightBrown]: [150, 112, 78],
  [AutoMovieHumanHairColor.Blond]: [205, 172, 120],
  [AutoMovieHumanHairColor.Auburn]: [128, 60, 36],
  [AutoMovieHumanHairColor.Red]: [170, 78, 40],
  [AutoMovieHumanHairColor.Gray]: [158, 155, 150],
  [AutoMovieHumanHairColor.White]: [226, 222, 214],
};
