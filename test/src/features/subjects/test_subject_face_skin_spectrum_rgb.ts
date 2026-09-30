import { TestValidator } from "@nestia/e2e";

import { faceSkinSpectrumRgb } from "../../../scripts/face-review/faceSkinSpectrumRgb";
import { nclose } from "../internal/predicates";

const flat = (value: number, bands = 39) =>
  Array.from({ length: bands }, () => value);
const colorimetry = {
  x: flat(1),
  y: flat(1),
  z: flat(1),
  illuminant: flat(1),
};

/**
 * A reflectance spectrum integrates to the linear sRGB albedo.
 *
 * Scenarios:
 * 1. With unit matching functions and illuminant, a flat reflectance r gives
 *    XYZ = (r, r, r), so the sRGB matrix rows' sums are the answer by hand:
 *    3.2404542 - 1.5371385 - 0.4985314 = 1.2047843, -0.969266 + 1.8760108 +
 *    0.041556 = 0.9483008 and 0.0556434 - 0.2040259 + 1.0572252 = 0.9088427,
 *    each times r.
 * 2. A reading covering only 31 bands (the minimum) gives the same albedo,
 *    because the luminance normalisation weighs the same bands.
 * 3. A reading of 30 bands is too short and gives none; a reading with a gap
 *    inside the range counts only its present bands.
 * 4. The illuminant weights the bands: with weight 2 on the first 20 bands and 1
 *    on the other 19, a flat spectrum's albedo is unchanged (the weights cancel
 *    in the normalisation) and a spectrum that is r on the first 20 bands and 0
 *    elsewhere gives r * 40 / 59 in luminance.
 */
export const test_subject_face_skin_spectrum_rgb = (): void => {
  const r = 0.5;
  const rgb = faceSkinSpectrumRgb(colorimetry, flat(r))!;
  TestValidator.predicate(
    "flat",
    nclose(rgb[0], r * 1.2047843, 1e-12) &&
      nclose(rgb[1], r * 0.9483008, 1e-12) &&
      nclose(rgb[2], r * 0.9088427, 1e-12),
  );
  const narrow = faceSkinSpectrumRgb(colorimetry, [
    ...flat(r, 31),
    ...Array.from({ length: 8 }, () => null),
  ])!;
  TestValidator.predicate(
    "minimum bands",
    nclose(narrow[0], rgb[0], 1e-12) && nclose(narrow[2], rgb[2], 1e-12),
  );
  TestValidator.equals(
    "too short",
    faceSkinSpectrumRgb(colorimetry, [
      ...flat(r, 30),
      ...Array.from({ length: 9 }, () => null),
    ]),
    null,
  );
  const gap = flat(r);
  (gap as (number | null)[])[10] = null;
  TestValidator.predicate(
    "gap",
    nclose(faceSkinSpectrumRgb(colorimetry, gap)![1], r * 0.9483008, 1e-12),
  );
  const weighted = {
    ...colorimetry,
    illuminant: Array.from({ length: 39 }, (_, band) => (band < 20 ? 2 : 1)),
  };
  const half = Array.from({ length: 39 }, (_, band) => (band < 20 ? r : 0));
  const lit = faceSkinSpectrumRgb(weighted, half)!;
  const weightSum = 20 * 2 + 19;
  TestValidator.predicate(
    "illuminant weighting",
    nclose(lit[1], ((r * 40) / weightSum) * 0.9483008, 1e-12) &&
      nclose(faceSkinSpectrumRgb(weighted, flat(r))![1], r * 0.9483008, 1e-12),
  );
};
