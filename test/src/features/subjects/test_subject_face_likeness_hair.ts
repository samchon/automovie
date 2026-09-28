import { TestValidator } from "@nestia/e2e";

import { faceLikenessSrgbToLab } from "../../../scripts/face-review/faceLikenessColour";
import {
  faceLikenessHairMeanShade,
  fitFaceLikenessHairColour,
} from "../../../scripts/face-review/faceLikenessHairFit";
import { faceLikenessLabToLinear } from "../../../scripts/face-review/faceLikenessIrisFit";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Hair finish colour from the photograph.
 * Scenarios:
 * 1. The colour is the hair-to-cheek linear ratio times the document skin
 *    over the fibre texture's mean shade, whatever tint the photograph's
 *    light adds to both samples.
 * 2. A hair brighter than the skin allows is held at one and flagged; a
 *    missing sample gives no colour; a black cheek and a mean shade outside
 *    (0, 1] refuse.
 * 3. The texture's mean shade is a linear value in (0, 1), and a shade
 *    strength of zero paints every fibre white, a mean of exactly one.
 */
export const test_subject_face_likeness_hair = (): void => {
  const lab = (rgb: readonly [number, number, number]) =>
    faceLikenessSrgbToLab(rgb[0], rgb[1], rgb[2]) as [number, number, number];
  const skin = [0.5, 0.3, 0.2] as const;
  // The same hair and cheek under a neutral and a warm light.
  const tint = (rgb: readonly number[], k: readonly number[]) =>
    rgb.map((v, c) => Math.round(v * k[c]!)) as [number, number, number];
  const hair = [60, 40, 30] as const;
  const cheek = [200, 150, 120] as const;
  const expected = [0, 1, 2].map(
    (c) =>
      ((faceLikenessLabToLinear(lab(hair))[c]! /
        faceLikenessLabToLinear(lab(cheek))[c]!) *
        skin[c]!) /
      0.5,
  );
  const neutral = fitFaceLikenessHairColour({
    hair: lab(hair),
    cheek: lab(cheek),
    skin,
    meanShade: 0.5,
  })!;
  const warm = fitFaceLikenessHairColour({
    hair: lab(tint(hair, [1, 0.9, 0.8])),
    cheek: lab(tint(cheek, [1, 0.9, 0.8])),
    skin,
    meanShade: 0.5,
  })!;
  TestValidator.predicate(
    "ratio over shade",
    neutral.color.every((v, c) => nclose(v, expected[c]!, 1e-9)) &&
      !neutral.clamped &&
      warm.color.every((v, c) => nclose(v, neutral.color[c]!, 0.01)),
  );
  const bright = fitFaceLikenessHairColour({
    hair: lab([250, 250, 250]),
    cheek: lab([120, 90, 70]),
    skin,
    meanShade: 0.4,
  })!;
  TestValidator.predicate(
    "held and missing",
    bright.clamped &&
      bright.color.every((v) => v <= 1) &&
      fitFaceLikenessHairColour({
        hair: null,
        cheek: lab(cheek),
        skin,
        meanShade: 0.5,
      }) === null,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () =>
        fitFaceLikenessHairColour({
          hair: lab(hair),
          cheek: [0, 0, 0],
          skin,
          meanShade: 0.5,
        }),
      "cheek",
    ) &&
      throwsError(
        () =>
          fitFaceLikenessHairColour({
            hair: lab(hair),
            cheek: lab(cheek),
            skin,
            meanShade: 0,
          }),
        "mean shade",
      ),
  );
  const shade = faceLikenessHairMeanShade({
    seed: 17,
    fibres: 24,
    coverage: 0.95,
    shade: 1,
  });
  TestValidator.predicate(
    "mean shade",
    shade > 0 &&
      shade < 1 &&
      nclose(
        faceLikenessHairMeanShade({
          seed: 17,
          fibres: 24,
          coverage: 0.95,
          shade: 0,
        }),
        1,
        1e-12,
      ),
  );
};
