import { TestValidator } from "@nestia/e2e";

import { faceLikenessSrgbToLab } from "../../../scripts/face-review/faceLikenessColour";
import {
  FACE_LIKENESS_BLENDSHAPES,
  type IFaceLikenessObservation,
  compareFaceLikeness,
  summarizeFaceLikeness,
} from "../../../scripts/face-review/faceLikenessCompare";
import {
  FACE_LIKENESS_HAIR,
  FACE_LIKENESS_IRIS,
  FACE_LIKENESS_SKIN,
  createFaceLikenessImage,
  createFaceLikenessLandmarks,
  createFaceLikenessMask,
} from "../internal/createFaceLikenessFixture";
import { nclose } from "../internal/predicates";

const turned = (angle: number): number[][] => [
  [Math.cos(angle), 0, Math.sin(angle), 0],
  [0, 1, 0, 0],
  [-Math.sin(angle), 0, Math.cos(angle), 0],
  [0, 0, 0, 1],
];

/**
 * One subject's separate signals and the population medians.
 * Scenarios:
 * 1. A render identical to its photograph has zero landmark residual, equal
 *    lid and lip values, hair IoU 1 with nothing uncovered, zero colour
 *    differences and equal skin-relative lightness; its detector pose
 *    differs by the 0.1 rad turned into the render transform (5.73 degrees).
 * 2. Frame hair 10 rows taller than the photograph's 110 rows gives the
 *    head-region IoU 110/120 over the fixture's head region, and the
 *    whole-frame IoU the same ratio; missing blendshapes read as 0.
 * 3. The iris minus skin lightness is the Lab difference of the fixture
 *    colours. Irises moved out of both apertures leave the iris colour and
 *    its relative lightness missing, and render hair over every pixel leaves
 *    no cheek skin, so the hair-relative lightness is missing too.
 * 4. The summary takes medians over subjects and counts only present
 *    values: a subject whose irises were not sampled adds nothing to the
 *    iris signals and nothing is counted as zero; an empty population has
 *    null medians and zero counts.
 */
export const test_subject_face_likeness_compare = (): void => {
  const face: IFaceLikenessObservation = {
    landmarks: createFaceLikenessLandmarks(),
    transform: turned(0),
    blendshapes: { eyeBlinkLeft: 0.2 },
  };
  const image = createFaceLikenessImage();
  const hair = createFaceLikenessMask(110);
  const same = compareFaceLikeness({
    reference: { face, image, hair },
    portrait: { face: { ...face, transform: turned(0.1) }, image, hair },
    frame: { face, hair },
  });
  TestValidator.predicate(
    "zero residual",
    nclose(same.landmarkRmsInterocular, 0) &&
      nclose(same.landmarkMedianInterocular, 0),
  );
  TestValidator.predicate(
    "pose difference",
    nclose(same.detectorPoseDifferenceDegrees, (0.1 * 180) / Math.PI),
  );
  TestValidator.equals(
    "eyes",
    same.eyeAperture.right.reference,
    same.eyeAperture.right.render,
  );
  TestValidator.equals(
    "mouth",
    same.mouthCornerLift.reference,
    same.mouthCornerLift.render,
  );
  TestValidator.equals(
    "hair iou",
    [same.hair.head.iou, same.hair.covered.iou],
    [1, 1],
  );
  TestValidator.equals(
    "nothing uncovered",
    same.hair.uncoveredReferenceShare,
    0,
  );
  TestValidator.equals(
    "colour differences",
    [
      same.colour.cheekRight,
      same.colour.cheekLeft,
      same.colour.irisRight,
      same.colour.irisLeft,
      same.colour.hair,
    ].map((pair) => pair.deltaE76),
    [0, 0, 0, 0, 0],
  );
  const irisL =
    faceLikenessSrgbToLab(...FACE_LIKENESS_IRIS)[0] -
    faceLikenessSrgbToLab(...FACE_LIKENESS_SKIN)[0];
  TestValidator.predicate(
    "iris minus skin",
    nclose(same.colour.irisMinusSkinLightness.reference!, irisL) &&
      nclose(same.colour.irisMinusSkinLightness.render!, irisL),
  );
  const hairL =
    faceLikenessSrgbToLab(...FACE_LIKENESS_HAIR)[0] -
    faceLikenessSrgbToLab(...FACE_LIKENESS_SKIN)[0];
  TestValidator.predicate(
    "hair minus skin",
    nclose(same.colour.hairMinusSkinLightness.render!, hairL),
  );
  TestValidator.equals("blendshape names", Object.keys(same.blendshapes), [
    ...FACE_LIKENESS_BLENDSHAPES,
  ]);
  TestValidator.equals("present blendshape", same.blendshapes.eyeBlinkLeft, {
    reference: 0.2,
    render: 0.2,
  });
  TestValidator.equals("absent blendshape", same.blendshapes.jawOpen, {
    reference: 0,
    render: 0,
  });

  const taller = compareFaceLikeness({
    reference: { face, image, hair },
    portrait: { face, image, hair },
    frame: { face, hair: createFaceLikenessMask(120) },
  });
  TestValidator.predicate("head iou", nclose(taller.hair.head.iou!, 110 / 120));
  TestValidator.predicate(
    "whole iou",
    nclose(taller.hair.covered.iou!, 110 / 120),
  );

  // A render with no iris pixels inside its apertures: closed lids.
  const closed = createFaceLikenessLandmarks().map((point, index) =>
    index === 468 || index === 473 ? ([150, 290] as const) : point,
  );
  const blind = compareFaceLikeness({
    reference: { face, image, hair },
    portrait: { face: { ...face, landmarks: closed }, image, hair },
    frame: { face, hair: createFaceLikenessMask(120) },
  });
  TestValidator.equals("missing iris", blind.colour.irisRight.deltaE76, null);
  TestValidator.equals(
    "missing relative iris",
    blind.colour.irisMinusSkinLightness.render,
    null,
  );
  // Hair over every render pixel leaves no cheek skin to relate lightness to.
  const covered = compareFaceLikeness({
    reference: { face, image, hair },
    portrait: { face, image, hair: createFaceLikenessMask(300) },
    frame: { face, hair },
  });
  TestValidator.equals("no render skin", covered.colour.cheekLeft.render, null);
  TestValidator.equals(
    "no skin base",
    covered.colour.hairMinusSkinLightness.render,
    null,
  );
  const summary = summarizeFaceLikeness([same, taller, blind]);
  TestValidator.equals("iris count", summary.irisDeltaE76!.count, 2);
  TestValidator.equals("iris median", summary.irisDeltaE76!.median, 0);
  TestValidator.equals("hair count", summary.hairIouHead!.count, 3);
  TestValidator.predicate(
    "hair median",
    nclose(summary.hairIouHead!.median!, 110 / 120),
  );
  TestValidator.equals(
    "eye error",
    summary.eyeApertureAbsoluteError!.median,
    0,
  );
  const empty = summarizeFaceLikeness([]);
  TestValidator.equals("empty population", empty.landmarkRmsInterocular, {
    median: null,
    count: 0,
  });
};
