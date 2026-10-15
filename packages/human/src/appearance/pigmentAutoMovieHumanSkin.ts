import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";

/**
 * Diffuse colour of skin from its chromophores, as linear RGB albedo in `[0, 1]`.
 *
 * The skin is two layers over a semi-infinite dermis, with the absorption spectra of Donner and Jensen (2006, Eurographics Symposium on Rendering, pp. 409-417, equations 6 and 7, coefficients in mm⁻¹ and λ in nm): eumelanin 6.6·10¹⁰ λ^-3.33, pheomelanin 2.9·10¹⁴ λ^-4.75, a bloodless baseline 0.0244 + 8.53 e^-(λ-154)/66.2, and haemoglobin at 75 percent oxygenation from Prahl's compiled molar extinction coefficients for whole blood at 150 g/L (S. Prahl, "Optical Absorption of Hemoglobin", Oregon Medical Laser Center, 1999), interpolated log-linearly between the tabulated wavelengths. Reduced scattering is their Mie plus Rayleigh fit 14.74 λ^-0.22 + 2.2·10¹¹ λ^-4 in the epidermis and half of it in the dermis. Grade: population-fitted spectra.
 *
 * The multipole reflectance of the paper is too heavy to evaluate here, so reflectance at each wavelength is a two-layer approximation (derived): the dermis reflects its Kubelka-Munk infinite-thickness value 1 + k - √(k² + 2k), with k = (8/3)·μa/μ's from the diffusion relations K = 2μa and S = (3/4)μ's; light crosses the epidermis twice, attenuated by exp(-2·μa,epi·d) over the 60 μm epidermis of Jacques (1998, "Skin Optics", Oregon Medical Laser Center News); and the stratum corneum returns a melanin-free 3 percent before any absorption (conventional). The spectrum from 400 to 700 nm in 10 nm steps is integrated against the CIE 1931 colour matching functions in the multi-lobe Gaussian fit of Wyman, Sloan and Shirley (2013, JCGT 2(2):1-11) under an equal-energy illuminant, converted to linear sRGB (IEC 61966-2-1) and divided by the result for a perfect white reflector, so white stays white.
 *
 * Checked against the descriptions of the paper's figures: melanin swept from 0.001 to 0.5 at eumelanin share 0.7 runs from pale through tan to dark brown (sRGB about 218 197 180 at 0.02, 189 148 106 at 0.12 and 140 91 50 at 0.35, haemoglobin 0.005 to 0.01), more haemoglobin turns pink, and a lower eumelanin share reads yellower. No measured skin colour was compared, so the formula is a documented approximation rather than a validated colorimetric model.
 *
 * @param pigmentation Melanin, eumelanin share and haemoglobin fractions; the iris is not read
 * @returns Linear RGB albedo, each channel in `[0, 1]`
 */
export function pigmentAutoMovieHumanSkin(
  pigmentation: Pick<
    IAutoMovieHumanIdentity.IPigmentation,
    "melanin" | "eumelaninShare" | "haemoglobin"
  >,
): { r: number; g: number; b: number } {
  const { melanin, eumelaninShare, haemoglobin } = pigmentation;
  const xyz: [number, number, number] = integrate((lambda: number): number => {
    const base: number = 0.0244 + 8.53 * Math.exp(-(lambda - 154) / 66.2);
    const epidermis: number =
      melanin *
        (eumelaninShare * 6.6e10 * Math.pow(lambda, -3.33) +
          (1 - eumelaninShare) * 2.9e14 * Math.pow(lambda, -4.75)) +
      (1 - melanin) * base;
    // whole blood absorption, mm⁻¹: 2.303 · e · 150 g/L / 64,500 g/mol per cm, a tenth per mm
    const blood: number =
      (0.1 *
        2.303 *
        150 *
        (OXYGENATION * extinction(OXY, lambda) +
          (1 - OXYGENATION) * extinction(DEOXY, lambda))) /
      64500;
    const dermis: number = haemoglobin * blood + (1 - haemoglobin) * base;
    const scattering: number =
      0.5 * (14.74 * Math.pow(lambda, -0.22) + 2.2e11 * Math.pow(lambda, -4));
    const k: number = ((8 / 3) * dermis) / scattering;
    const deep: number = 1 + k - Math.sqrt(k * k + 2 * k);
    return (
      CORNEUM + (1 - CORNEUM) * Math.exp(-2 * epidermis * EPIDERMIS) * deep
    );
  });
  const rgb: [number, number, number] = toLinearSrgb(xyz);
  const white: [number, number, number] = toLinearSrgb(
    integrate((): number => 1),
  );
  const channel = (i: number): number =>
    Math.min(1, Math.max(0, rgb[i]! / white[i]!));
  return { r: channel(0), g: channel(1), b: channel(2) };
}

/** Blood oxygenation, the fixed value of Donner and Jensen (2006). */
const OXYGENATION: number = 0.75;

/** Epidermis thickness, millimetres (Jacques 1998). */
const EPIDERMIS: number = 0.06;

/** Melanin-free reflectance of the stratum corneum's own scattering; conventional. */
const CORNEUM: number = 0.03;

/** Wavelengths of Prahl's tabulated extinction coefficients, nm. */
const WAVELENGTHS: readonly number[] = [450, 500, 542, 560, 576, 600, 650, 700];

/** Molar extinction of oxyhaemoglobin at {@link WAVELENGTHS}, cm⁻¹/M (Prahl 1999). */
const OXY: readonly number[] = [
  62816, 20932.8, 53292, 32613.2, 55540, 3200, 368, 290,
];

/** Molar extinction of deoxyhaemoglobin at {@link WAVELENGTHS}, cm⁻¹/M (Prahl 1999). */
const DEOXY: readonly number[] = [
  103292, 20862, 48148, 53788, 40092, 14677.2, 3750.12, 1794.28,
];

/** Extinction at a wavelength, log-linear between samples and held beyond them. */
function extinction(table: readonly number[], lambda: number): number {
  if (lambda <= WAVELENGTHS[0]!) return table[0]!;
  for (let i: number = 1; i < WAVELENGTHS.length; ++i)
    if (lambda <= WAVELENGTHS[i]!) {
      const t: number =
        (lambda - WAVELENGTHS[i - 1]!) /
        (WAVELENGTHS[i]! - WAVELENGTHS[i - 1]!);
      return Math.exp(
        (1 - t) * Math.log(table[i - 1]!) + t * Math.log(table[i]!),
      );
    }
  return table[table.length - 1]!;
}

/** CIE XYZ of a reflectance spectrum under an equal-energy illuminant, 400 to 700 nm in 10 nm steps. */
function integrate(
  reflectance: (lambda: number) => number,
): [number, number, number] {
  const sum: [number, number, number] = [0, 0, 0];
  for (let lambda: number = 400; lambda <= 700; lambda += 10) {
    const r: number = reflectance(lambda);
    sum[0] +=
      r *
      (1.056 * lobe(lambda, 599.8, 37.9, 31.0) +
        0.362 * lobe(lambda, 442.0, 16.0, 26.7) -
        0.065 * lobe(lambda, 501.1, 20.4, 26.2));
    sum[1] +=
      r *
      (0.821 * lobe(lambda, 568.8, 46.9, 40.5) +
        0.286 * lobe(lambda, 530.9, 16.3, 31.1));
    sum[2] +=
      r *
      (1.217 * lobe(lambda, 437.0, 11.8, 36.0) +
        0.681 * lobe(lambda, 459.0, 26.0, 13.8));
  }
  return sum;
}

/** Piecewise Gaussian of Wyman et al. (2013), with its own width on each side of the mean. */
function lobe(
  lambda: number,
  mean: number,
  below: number,
  above: number,
): number {
  const s: number = lambda < mean ? below : above;
  return Math.exp(-0.5 * ((lambda - mean) / s) ** 2);
}

/** Linear sRGB of a CIE XYZ triple (IEC 61966-2-1 matrix). */
function toLinearSrgb([x, y, z]: [number, number, number]): [
  number,
  number,
  number,
] {
  return [
    3.2406 * x - 1.5372 * y - 0.4986 * z,
    -0.9689 * x + 1.8758 * y + 0.0415 * z,
    0.0557 * x - 0.204 * y + 1.057 * z,
  ];
}
