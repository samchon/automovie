/**
 * Diffuse colour of skin from its chromophores, as linear RGB albedo.
 *
 * The skin is two layers over a semi-infinite dermis, with the absorption
 * spectra of Donner and Jensen (2006, Eurographics Symposium on Rendering,
 * pp. 409-417, equations 6 and 7, coefficients in 1/mm and wavelength in
 * nm): eumelanin `6.6e10 l^-3.33`, pheomelanin `2.9e14 l^-4.75`, a
 * bloodless baseline `0.0244 + 8.53 exp(-(l - 154) / 66.2)`, and
 * haemoglobin at 75 percent oxygenation from Prahl's molar extinction
 * coefficients for whole blood at 150 g/L (S. Prahl, "Optical Absorption of
 * Hemoglobin", Oregon Medical Laser Center, 1999), interpolated
 * log-linearly between the tabulated wavelengths. Reduced scattering is
 * their Mie plus Rayleigh fit `14.74 l^-0.22 + 2.2e11 l^-4` in the
 * epidermis and half of it in the dermis. The epidermis also absorbs in a
 * carotenoid band at 465 nm (see {@link CAROTENOID}), the yellow pigment
 * the two-chromophore model lacks, without which fair skin reflects blue
 * almost as strongly as green.
 *
 * Reflectance per wavelength is a two-layer approximation rather than the
 * paper's multipole: the dermis reflects its Kubelka-Munk infinite-thickness
 * value `1 + k - sqrt(k^2 + 2k)` with `k = (8/3) mu_a / mu_s'`; light crosses
 * the 60 um epidermis of Jacques (1998, "Skin Optics") twice; and the
 * stratum corneum returns a melanin-free 3 percent (a convention). The
 * spectrum from 400 to 700 nm in 10 nm steps is integrated against the
 * CIE 1931 matching functions in the multi-lobe fit of Wyman, Sloan and
 * Shirley (2013, JCGT 2(2)) under an equal-energy illuminant, converted to
 * linear sRGB (IEC 61966-2-1) and divided by a perfect white reflector's
 * result. No measured skin colour was compared, so this is a documented
 * approximation, not a validated colorimetric model.
 */
export namespace AutoMovieHumanSkinPigment {
  /** Chromophore volume fractions. */
  export interface IChromophores {
    /** Epidermal melanin volume fraction. */
    melanin: number;

    /** Share of eumelanin in the melanin, the rest pheomelanin. */
    eumelaninShare: number;

    /** Dermal haemoglobin volume fraction. */
    haemoglobin: number;
  }

  /**
   * Linear RGB albedo of one chromophore set.
   *
   * @param c Chromophore fractions; melanin is clamped to `[0, 0.5]` and
   *   haemoglobin to `[0.001, 0.32]`, the public parameter domains
   * @returns Linear RGB, each channel in `[0, 1]`
   */
  export function albedo(c: IChromophores): [number, number, number] {
    const melanin: number = Math.min(0.5, Math.max(0, c.melanin));
    const share: number = Math.min(1, Math.max(0, c.eumelaninShare));
    const haemoglobin: number = Math.min(0.32, Math.max(0.001, c.haemoglobin));
    const xyz: [number, number, number] = integrate(
      (lambda: number): number => {
        const base: number = 0.0244 + 8.53 * Math.exp(-(lambda - 154) / 66.2);
        const epidermis: number =
          melanin *
            (share * 6.6e10 * Math.pow(lambda, -3.33) +
              (1 - share) * 2.9e14 * Math.pow(lambda, -4.75)) +
          (1 - melanin) * base +
          CAROTENOID * Math.exp(-(((lambda - 465) / 30) ** 2));

        // Whole blood absorption in 1/mm: 2.303 e 150 g/L / 64,500 g/mol
        // per cm, a tenth of it per mm.
        const blood: number =
          (0.1 *
            2.303 *
            150 *
            (OXYGENATION * extinction(OXY, lambda) +
              (1 - OXYGENATION) * extinction(DEOXY, lambda))) /
          64500;
        const dermis: number = haemoglobin * blood + (1 - haemoglobin) * base;
        const scattering: number =
          0.5 *
          (14.74 * Math.pow(lambda, -0.22) + 2.2e11 * Math.pow(lambda, -4));
        const k: number = ((8 / 3) * dermis) / scattering;
        const deep: number = 1 + k - Math.sqrt(k * k + 2 * k);
        return (
          CORNEUM + (1 - CORNEUM) * Math.exp(-2 * epidermis * EPIDERMIS) * deep
        );
      },
    );
    const rgb: [number, number, number] = toLinearSrgb(xyz);
    const white: [number, number, number] = toLinearSrgb(
      integrate((): number => 1),
    );
    return [0, 1, 2].map((i: number): number =>
      Math.min(1, Math.max(0, rgb[i]! / white[i]!)),
    ) as [number, number, number];
  }

  /**
   * Albedo table over melanin and haemoglobin multipliers of one person's
   * chromophores, so per-vertex regional factors cost a bilinear lookup
   * instead of a spectral integration.
   */
  export interface ITable {
    /** Look up the albedo for multipliers of the person's melanin and haemoglobin. */
    lookup(melanin: number, haemoglobin: number): [number, number, number];
  }

  /**
   * Tabulate {@link albedo} over multipliers of one chromophore set.
   *
   * Melanin multipliers span `[0, 2]` and haemoglobin multipliers `[0, 8]`,
   * both in 32 steps; lookups outside are clamped to the table.
   *
   * @param person The person's chromophores
   * @returns The table
   */
  export function table(person: IChromophores): ITable {
    const M: number = 33;
    const H: number = 33;
    const maxMelanin: number = 2;
    const maxHaemoglobin: number = 8;
    const values: Float64Array = new Float64Array(M * H * 3);
    for (let i: number = 0; i < M; ++i)
      for (let j: number = 0; j < H; ++j) {
        const rgb: [number, number, number] = albedo({
          melanin: person.melanin * ((maxMelanin * i) / (M - 1)),
          eumelaninShare: person.eumelaninShare,
          haemoglobin: person.haemoglobin * ((maxHaemoglobin * j) / (H - 1)),
        });
        values.set(rgb, (i * H + j) * 3);
      }
    return {
      lookup: (
        melanin: number,
        haemoglobin: number,
      ): [number, number, number] => {
        const x: number =
          (Math.min(maxMelanin, Math.max(0, melanin)) / maxMelanin) * (M - 1);
        const y: number =
          (Math.min(maxHaemoglobin, Math.max(0, haemoglobin)) /
            maxHaemoglobin) *
          (H - 1);
        const i: number = Math.min(M - 2, Math.floor(x));
        const j: number = Math.min(H - 2, Math.floor(y));
        const tx: number = x - i;
        const ty: number = y - j;
        const out: [number, number, number] = [0, 0, 0];
        for (let c: number = 0; c < 3; ++c) {
          const a: number = values[(i * H + j) * 3 + c]!;
          const b: number = values[((i + 1) * H + j) * 3 + c]!;
          const d: number = values[(i * H + j + 1) * 3 + c]!;
          const e: number = values[((i + 1) * H + j + 1) * 3 + c]!;
          out[c] = (a + (b - a) * tx) * (1 - ty) + (d + (e - d) * tx) * ty;
        }
        return out;
      },
    };
  }
}

/** Blood oxygenation, the fixed value of Donner and Jensen (2006). */
const OXYGENATION: number = 0.75;

/** Epidermis thickness in mm (Jacques 1998). */
const EPIDERMIS: number = 0.06;

/** Melanin-free reflectance of the stratum corneum; a convention. */
const CORNEUM: number = 0.03;

/**
 * Peak epidermal absorption of the carotenoid band in 1/mm, a Gaussian at
 * 465 nm with 30 nm width standing in for the beta-carotene absorption that
 * Donner and Jensen omit; amplitude and shape are conventions, not
 * tabulated extinction data.
 */
const CAROTENOID: number = 1.3;

/** Wavelengths of Prahl's tabulated extinction coefficients in nm. */
const WAVELENGTHS: readonly number[] = [450, 500, 542, 560, 576, 600, 650, 700];

/** Molar extinction of oxyhaemoglobin at {@link WAVELENGTHS}, 1/(cm M) (Prahl 1999). */
const OXY: readonly number[] = [
  62816, 20932.8, 53292, 32613.2, 55540, 3200, 368, 290,
];

/** Molar extinction of deoxyhaemoglobin at {@link WAVELENGTHS}, 1/(cm M) (Prahl 1999). */
const DEOXY: readonly number[] = [
  103292, 20862, 48148, 53788, 40092, 14677.2, 3750.12, 1794.28,
];

/**
 * Extinction at a wavelength, log-linear between samples and held beyond.
 *
 * @param table Extinction per tabulated wavelength
 * @param lambda Wavelength in nm
 * @returns Molar extinction
 */
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

/**
 * CIE XYZ of a reflectance spectrum under an equal-energy illuminant.
 *
 * @param reflectance Reflectance per wavelength in nm
 * @returns Unnormalised XYZ
 */
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

/**
 * Piecewise Gaussian of Wyman et al. (2013).
 *
 * @param lambda Wavelength in nm
 * @param mean Lobe centre in nm
 * @param below Width below the centre in nm
 * @param above Width above the centre in nm
 * @returns Lobe value
 */
function lobe(
  lambda: number,
  mean: number,
  below: number,
  above: number,
): number {
  const s: number = lambda < mean ? below : above;
  return Math.exp(-0.5 * ((lambda - mean) / s) ** 2);
}

/**
 * Linear sRGB of a CIE XYZ triple (IEC 61966-2-1 matrix).
 *
 * @param xyz XYZ triple
 * @returns Linear RGB, possibly out of gamut
 */
function toLinearSrgb(
  xyz: readonly [number, number, number],
): [number, number, number] {
  const x: number = xyz[0];
  const y: number = xyz[1];
  const z: number = xyz[2];
  return [
    3.2406 * x - 1.5372 * y - 0.4986 * z,
    -0.9689 * x + 1.8758 * y + 0.0415 * z,
    0.0557 * x - 0.204 * y + 1.057 * z,
  ];
}
