import { AutoMovieHumanMonotoneCubic } from "../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanHairline } from "../typings/AutoMovieHumanHairline";

/**
 * Hair-bearing boundary of the scalp as a height above eye level for each
 * azimuth around the head chart (see `AutoMovieHumanHeadField`).
 *
 * A head-skin point at azimuth `alpha` bears hair when its height above the
 * eyes' centres exceeds {@link height}. Heights are fractions of the head
 * height parameter (menton to vertex), so the boundary follows head size.
 * The boundary is mirror-symmetric (it reads `|alpha|`), and runs from the
 * frontal hairline (trichion) over the temples, down the sideburns in front
 * of the ear, over the ear and down behind it to the nape.
 *
 * Knots are conventions placed from these proportions, not measurements of
 * one person: trichion about 70 mm above eye level for a 216 mm head
 * (glabella about 12 mm above the eyes plus a forehead height tr-g near
 * 58 mm, the 55 to 61 mm of the adult means in `docs/anatomy/hair.md`);
 * sideburns reaching eye level; the margin over the ear about 28 mm above
 * eye level, clear of the auricle; the nape margin about 70 mm below eye
 * level. The five frontal shapes follow the class definitions of
 * Zhang 2026 (after Suzan et al.) in `docs/anatomy/hair.md`: `round` a
 * smooth arc; `rectangular` a flat front with a sharp temporal corner;
 * `mShaped` raised over the temples; `bellShaped` with the midline about
 * 2 cm higher; `triangular` descending almost straight from the midline to
 * the temples. Interpolation is monotone piecewise cubic
 * (`AutoMovieHumanMonotoneCubic`), so the boundary never overshoots between
 * knots, and level at both ends: the knots run from the front midline
 * (0 degrees) to the back midline (180 degrees) of a boundary mirrored
 * across both, where any other end slope would fold into a cusp, a notch
 * at the parting of the frontal hairline.
 */
export namespace AutoMovieHumanScalpBoundary {
  /**
   * Boundary height above eye level at one azimuth.
   *
   * @param hairline Frontal hairline class
   * @param alpha Azimuth from the front (+X) toward +Z, radians
   * @param headHeight Head height parameter, millimetres
   * @returns Height in millimetres above the eyes' centres
   */
  export function height(
    hairline: AutoMovieHumanHairline,
    alpha: number,
    headHeight: number,
  ): number {
    // Fold the azimuth into [0, 180] degrees: the boundary is symmetric.
    let degrees: number = Math.abs((alpha * 180) / Math.PI) % 360;
    if (degrees > 180) degrees = 360 - degrees;
    const knots: Array<[number, number]> = [...FRONT[hairline], ...COMMON];
    return AutoMovieHumanMonotoneCubic.interpolate(knots, degrees) * headHeight;
  }
}

/** Frontal knots `[degrees, fraction of head height]` per hairline class. */
const FRONT: Record<AutoMovieHumanHairline, Array<[number, number]>> = {
  [AutoMovieHumanHairline.Round]: [
    [0, 0.33],
    [30, 0.31],
    [50, 0.26],
  ],
  [AutoMovieHumanHairline.Rectangular]: [
    [0, 0.31],
    [30, 0.31],
    [44, 0.3],
    [52, 0.24],
  ],
  [AutoMovieHumanHairline.MShaped]: [
    [0, 0.33],
    [22, 0.36],
    [36, 0.41],
    [50, 0.3],
  ],
  // Zhang's "about 2 cm higher" is a trichion-glabella distance, which
  // anthropometry takes straight across a forehead that slopes back, so it
  // rises much less than 2 cm; adding 2 cm vertically (0.42) put the
  // trichion within 15 mm of the vertex, where the rendered head read as
  // bald. The midline here is about 1.5 cm higher along the forehead than
  // the round class (0.37 against 0.33 on an adult midline profile), a
  // convention of this prototype within that reading. A bell is a dome,
  // nearly level over the central forehead before it falls to the temples,
  // not a peak at the midline.
  [AutoMovieHumanHairline.BellShaped]: [
    [0, 0.37],
    [16, 0.365],
    [32, 0.33],
    [46, 0.28],
    [56, 0.23],
  ],
  [AutoMovieHumanHairline.Triangular]: [
    [0, 0.38],
    [25, 0.32],
    [50, 0.25],
  ],
};

/** Temple, sideburn, ear and nape knots shared by every class. */
const COMMON: Array<[number, number]> = [
  [64, 0.16],
  [76, 0.0],
  [86, 0.0],
  [94, 0.13],
  [108, 0.12],
  [122, -0.08],
  [140, -0.26],
  [160, -0.32],
  [180, -0.33],
];
