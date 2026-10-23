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
 * the temples. Interpolation is monotone piecewise cubic (Fritsch and
 * Carlson 1980), so the boundary never overshoots between knots.
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
    return interpolate(knots, degrees) * headHeight;
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
  [AutoMovieHumanHairline.BellShaped]: [
    [0, 0.42],
    [18, 0.37],
    [36, 0.31],
    [50, 0.26],
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

/**
 * Monotone piecewise cubic Hermite interpolation (Fritsch-Carlson).
 *
 * Interior slopes are the harmonic mean of the neighbouring secants when
 * those agree in sign and zero otherwise, which keeps each piece within
 * its knot values; end slopes are the end secants.
 *
 * @param knots Strictly increasing abscissae with values
 * @param x Abscissa, clamped to the knot range
 * @returns Interpolated value
 */
function interpolate(knots: Array<[number, number]>, x: number): number {
  const n: number = knots.length;
  if (x <= knots[0]![0]) return knots[0]![1];
  if (x >= knots[n - 1]![0]) return knots[n - 1]![1];

  let k: number = 0;
  while (knots[k + 1]![0] < x) ++k;

  const secant: (i: number) => number = (i: number): number =>
    (knots[i + 1]![1] - knots[i]![1]) / (knots[i + 1]![0] - knots[i]![0]);
  const slope: (i: number) => number = (i: number): number => {
    if (i === 0) return secant(0);
    if (i === n - 1) return secant(n - 2);
    const a: number = secant(i - 1);
    const b: number = secant(i);
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  };

  const [x0, y0] = knots[k]!;
  const [x1, y1] = knots[k + 1]!;
  const h: number = x1 - x0;
  const t: number = (x - x0) / h;
  const t2: number = t * t;
  const t3: number = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * h * slope(k) +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * h * slope(k + 1)
  );
}
