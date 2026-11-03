/**
 * How much scalp real hair lets through: the occlusion law the scalp layer
 * and the root count follow.
 *
 * Hair fibres of diameter d rooted at an areal density rho occlude the scalp
 * as independent random occluders, so the share of scalp seen through the
 * hair over a point is T = exp(-tau) (Poisson occlusion, the Beer-Lambert
 * form), tau the projected fibre area per scalp area of all hair lying over
 * the point. Beside a parting, hair rooted between the part line and a point
 * at distance x passes over it, so tau = rho d x and the scalp is half seen
 * at x = ln 2 / (rho d), about 5.6 mm at the density here.
 *
 * The scalp seen through the hair is also shaded by it. Diffuse light reaches
 * the scalp from the hemisphere above, and a ray at angle theta from the
 * normal crosses the hair's optical depth tau along the slant path tau / mu,
 * mu = cos theta, so the scalp is lit by the share
 * L = 2 * integral over mu in (0, 1) of mu * exp(-tau / mu) dmu = 2 * E3(tau)
 * of the open sky (the cosine-weighted mean of the slanted transmittance;
 * E3 is the third exponential integral). L is 1 for bare scalp and falls
 * faster than T: where the scalp is half seen (tau = ln 2) it is lit by
 * about a third. The hair shades the scalp it leaves visible, which is why a
 * parting reads as dark scalp and not as bare skin.
 *
 * Density and diameter are the means of the four scalp sites of Leerunyakul
 * 2020 (frontal 154.3, vertex 162.9, temporoparietal 133.7, occipital 160.2
 * hairs per cm2; diameters 81.1, 80.8, 80.1, 80.3 um), the one primary
 * trichoscopic source read; the quoted Caucasian densities are about 45
 * percent higher (`docs/anatomy/hair.md`). Both are measured values.
 */
export namespace AutoMovieHumanHairOcclusion {
  /** Mean scalp hair density, hairs per mm2 (Leerunyakul 2020, measured). */
  export const DENSITY: number = 1.528;

  /** Mean hair diameter, mm (Leerunyakul 2020, measured). */
  export const DIAMETER: number = 0.0806;

  /**
   * Share of scalp seen through hair of an optical depth.
   *
   * @param depth Projected fibre area per scalp area, dimensionless
   * @returns T in (0, 1]
   */
  export function seen(depth: number): number {
    return Math.exp(-depth);
  }

  /**
   * Share of the open sky's diffuse light that reaches the scalp under hair
   * of an optical depth, 2 * E3(depth), by Simpson's rule on the integral
   * 2 * (mu * exp(-depth / mu)) over mu in (0, 1), whose integrand is smooth
   * and vanishes at mu = 0.
   *
   * @param depth Projected fibre area per scalp area, dimensionless
   * @returns L in (0, 1]
   */
  export function lit(depth: number): number {
    if (!(depth > 0)) return 1;
    const n: number = 64;
    const f = (mu: number): number => (mu > 0 ? mu * Math.exp(-depth / mu) : 0);
    let sum: number = f(0) + f(1);
    for (let i: number = 1; i < n; ++i) sum += (i % 2 === 1 ? 4 : 2) * f(i / n);
    return (2 * sum) / (3 * n);
  }
}
