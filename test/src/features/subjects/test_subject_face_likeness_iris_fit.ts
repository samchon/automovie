import { TestValidator } from "@nestia/e2e";

import { faceLikenessSrgbToLab } from "../../../scripts/face-review/faceLikenessColour";
import {
  FACE_LIKENESS_IRIS_BASE_SHARE,
  FACE_LIKENESS_IRIS_MEAN_BAND,
  faceLikenessLabToLinear,
  fitFaceLikenessIrisPigment,
} from "../../../scripts/face-review/faceLikenessIrisFit";
import { nclose } from "../internal/predicates";

const linearToLab = (rgb: readonly number[]): [number, number, number] => {
  const encode = (value: number): number =>
    255 *
    (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055);
  return faceLikenessSrgbToLab(
    encode(rgb[0]!),
    encode(rgb[1]!),
    encode(rgb[2]!),
  );
};

/**
 * Iris pigment from the photograph's iris-to-cheek ratio.
 * Scenarios:
 * 1. Lab of white, black and a known linear colour convert back to linear
 *    RGB (1, 1, 1), (0, 0, 0) and that colour.
 * 2. A photograph whose iris is 0.1 of its cheek in every channel under a
 *    tinted light gives a mean stroma of 0.1 times the document skin, split
 *    into base 0.27 m and variation (m - base) / 0.478; the tint cancels.
 * 3. An iris brighter than the skin is scaled down so base plus variation
 *    peaks at exactly 1, and the row says so.
 * 4. A missing iris or cheek sample gives no pigment; a black cheek refuses.
 */
export const test_subject_face_likeness_iris_fit = (): void => {
  const close = (a: readonly number[], b: readonly number[], eps = 1e-4) =>
    a.every((value, k) => nclose(value, b[k]!, eps));
  TestValidator.predicate(
    "white",
    close(faceLikenessLabToLinear([100, 0, 0]), [1, 1, 1]),
  );
  TestValidator.predicate(
    "black",
    close(faceLikenessLabToLinear([0, 0, 0]), [0, 0, 0]),
  );
  TestValidator.predicate(
    "known colour",
    close(
      faceLikenessLabToLinear(linearToLab([0.2, 0.05, 0.6])),
      [0.2, 0.05, 0.6],
      3e-3,
    ),
  );

  const light = [0.9, 0.7, 0.5];
  const cheekLinear = [0.6, 0.4, 0.3].map((value, c) => value * light[c]!);
  const skin: [number, number, number] = [0.5, 0.3, 0.2];
  const fit = fitFaceLikenessIrisPigment({
    iris: linearToLab(cheekLinear.map((value) => 0.1 * value)),
    cheek: linearToLab(cheekLinear),
    skin,
  })!;
  const mean = skin.map((value) => 0.1 * value);
  TestValidator.predicate("tint cancels", close(fit.mean, mean, 2e-3));
  TestValidator.predicate(
    "band split",
    close(
      fit.pigment.base,
      fit.mean.map((value) => FACE_LIKENESS_IRIS_BASE_SHARE * value),
      1e-12,
    ) &&
      close(
        fit.pigment.variation,
        fit.mean.map(
          (value, c) =>
            (value - fit.pigment.base[c]!) / FACE_LIKENESS_IRIS_MEAN_BAND,
        ),
        1e-12,
      ),
  );
  TestValidator.equals("not scaled", fit.scaled, false);

  const bright = fitFaceLikenessIrisPigment({
    iris: linearToLab([0.9, 0.9, 0.9]),
    cheek: linearToLab([0.3, 0.3, 0.3]),
    skin: [0.6, 0.5, 0.4],
  })!;
  const peak = Math.max(
    ...bright.pigment.base.map(
      (value, c) => value + bright.pigment.variation[c]!,
    ),
  );
  TestValidator.predicate(
    "scaled to the unit range",
    bright.scaled && nclose(peak, 1, 1e-9),
  );

  TestValidator.equals(
    "missing iris",
    fitFaceLikenessIrisPigment({ iris: null, cheek: [50, 0, 0], skin }),
    null,
  );
  TestValidator.equals(
    "missing cheek",
    fitFaceLikenessIrisPigment({ iris: [50, 0, 0], cheek: null, skin }),
    null,
  );
  let refused = false;
  try {
    fitFaceLikenessIrisPigment({ iris: [50, 0, 0], cheek: [0, 0, 0], skin });
  } catch {
    refused = true;
  }
  TestValidator.predicate("black cheek refuses", refused);
};
