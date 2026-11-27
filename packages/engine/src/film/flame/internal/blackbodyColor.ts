import type { IAutoMovieColor } from "@automovie/interface";

/*
 * Linear sRGB colour of a blackbody at `kelvin`, scaled so its largest channel
 * is 1, for a flame light's colour.
 *
 * Planck's spectral radiance `λ^−5 / (exp(c2 / (λ T)) − 1)`, with the second
 * radiation constant `c2 = hc / k = 1.438777e-2 m·K` (CODATA 2018) and its
 * constant factor dropped because the result is normalized, is weighted by the
 * CIE 1931 2° colour-matching functions in the multi-lobe piecewise Gaussian
 * fit of Wyman, Sloan and Shirley ("Simple analytic approximations to the CIE
 * XYZ color matching functions", JCGT 2(2), 2013, equation 2), at every
 * nanometre from 360 to 830 nm. The tristimulus values are converted with the
 * IEC 61966-2-1 XYZ to linear sRGB matrix. A channel below zero, a chromaticity
 * outside the sRGB gamut, is clamped to zero before scaling.
 * When `kelvin` is not finite and positive.
 */
export function blackbodyColor(kelvin: number): IAutoMovieColor {
  if (kelvin <= 0)
    throw new RangeError(
      `blackbody temperature must be positive, got ${kelvin}`,
    );
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  for (let nm: number = 360; nm <= 830; ++nm) {
    const metres: number = nm * 1e-9;
    const radiance: number =
      1 /
      (Math.pow(metres, 5) *
        (Math.exp(SECOND_RADIATION / (metres * kelvin)) - 1));
    x +=
      radiance *
      (1.056 * lobe(nm, 599.8, 37.9, 31.0) +
        0.362 * lobe(nm, 442.0, 16.0, 26.7) -
        0.065 * lobe(nm, 501.1, 20.4, 26.2));
    y +=
      radiance *
      (0.821 * lobe(nm, 568.8, 46.9, 40.5) +
        0.286 * lobe(nm, 530.9, 16.3, 31.1));
    z +=
      radiance *
      (1.217 * lobe(nm, 437.0, 11.8, 36.0) +
        0.681 * lobe(nm, 459.0, 26.0, 13.8));
  }
  const rgb: number[] = [
    3.2406 * x - 1.5372 * y - 0.4986 * z,
    -0.9689 * x + 1.8758 * y + 0.0415 * z,
    0.0557 * x - 0.204 * y + 1.057 * z,
  ].map((channel: number): number => Math.max(0, channel));
  const peak: number = Math.max(...rgb);
  return {
    r: rgb[0]! / peak,
    g: rgb[1]! / peak,
    b: rgb[2]! / peak,
    a: null,
    hex: null,
  };
}

/*
 * Planck's constant times the speed of light over Boltzmann's constant, m·K.
 */
const SECOND_RADIATION: number = 1.438776877e-2;

/*
 * One piecewise Gaussian lobe of the fit: width `below` left of `mean`, `above`
 * right of it.
 */
function lobe(nm: number, mean: number, below: number, above: number): number {
  const t: number = (nm - mean) / (nm < mean ? below : above);
  return Math.exp(-0.5 * t * t);
}
