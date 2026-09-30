/** The colorimetric tables of the archive: colour matching functions and illuminant per wavelength. */
export interface IFaceSkinColorimetry {
  x: readonly number[];
  y: readonly number[];
  z: readonly number[];
  illuminant: readonly number[];
}

/** XYZ (relative to the perfect diffuser) to linear sRGB, IEC 61966-2-1. */
const SRGB = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.969266, 1.8760108, 0.041556],
  [0.0556434, -0.2040259, 1.0572252],
] as const;

/** A reading must span the visible range the colour matching functions weigh. */
const MINIMUM_BANDS = 31;

/**
 * The linear sRGB albedo of one reflectance spectrum, or `null` when the
 * reading is too short to weigh.
 *
 * `reflectance` holds one value per table wavelength as a fraction, `null`
 * where the instrument did not cover the band (readings run 360 to 740 or
 * 400 to 700 nm). The spectrum is integrated with the CIE 1931 2 degree
 * colour matching functions under the illuminant over the bands present, and
 * the sum is normalised by the illuminant-weighted luminance function so a
 * perfect diffuser is Y = 1; the same bands normalise the sum they weigh, so a
 * shorter instrument range does not darken a reading. XYZ then maps through
 * the sRGB matrix to the albedo a renderer's linear base colour means. Pure.
 */
export function faceSkinSpectrumRgb(
  colorimetry: IFaceSkinColorimetry,
  reflectance: readonly (number | null)[],
): [number, number, number] | null {
  const bands = reflectance.reduce<number>(
    (count, value) => count + (value === null ? 0 : 1),
    0,
  );
  if (bands < MINIMUM_BANDS) return null;
  let norm = 0;
  const sums = [0, 0, 0];
  reflectance.forEach((value, band) => {
    if (value === null) return;
    const weight = colorimetry.illuminant[band]!;
    norm += weight * colorimetry.y[band]!;
    sums[0]! += value * weight * colorimetry.x[band]!;
    sums[1]! += value * weight * colorimetry.y[band]!;
    sums[2]! += value * weight * colorimetry.z[band]!;
  });
  const xyz = sums.map((sum) => sum / norm);
  return SRGB.map((row) => row[0] * xyz[0]! + row[1] * xyz[1]! + row[2] * xyz[2]!) as [
    number,
    number,
    number,
  ];
}
