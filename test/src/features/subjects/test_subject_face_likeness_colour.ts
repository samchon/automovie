import { TestValidator } from "@nestia/e2e";

import {
  faceLikenessCheekColour,
  faceLikenessHairColour,
  faceLikenessInsidePolygon,
  faceLikenessIrisColour,
  faceLikenessSampleColour,
  faceLikenessSrgbToLab,
} from "../../../scripts/face-review/faceLikenessColour";
import type { FaceLikenessPoint } from "../../../scripts/face-review/faceLikenessGeometry";
import {
  FACE_LIKENESS_HAIR,
  FACE_LIKENESS_IRIS,
  FACE_LIKENESS_SKIN,
  createFaceLikenessImage,
  createFaceLikenessLandmarks,
  createFaceLikenessMask,
} from "../internal/createFaceLikenessFixture";
import { nclose, throwsError } from "../internal/predicates";

const labClose = (
  a: readonly number[],
  b: readonly number[],
  eps = 1e-3,
): boolean => a.every((value, index) => nclose(value, b[index]!, eps));

/**
 * Anatomical colour samples in CIELAB.
 * Scenarios:
 * 1. sRGB white, black and pure red convert to the published CIELAB values
 *    (D65) (100, 0, 0), (0, 0, 0) and (53.241, 80.092, 67.203); the grey
 *    (3, 3, 3), whose luminance lies on both linear segments, has
 *    L* = 903.3 * (3 / 255 / 12.92) = 0.823.
 * 2. The cheek disc of the fixture reads only skin, both irises read the
 *    iris colour inside their apertures and are assigned to the eye that
 *    contains them, and the hair sample reads only hair pixels.
 * 3. A cheek disc fully covered by excluded hair and an iris whose centre
 *    lies outside both apertures return missing observations; an iris whose
 *    rim is three times as wide, so that the lids cover most of its annulus,
 *    keeps its side and gives no colour.
 * 4. Malformed pixels and frames that differ from the image refuse.
 * 5. The even-odd polygon test accepts an interior point and rejects an
 *    exterior one.
 */
export const test_subject_face_likeness_colour = (): void => {
  TestValidator.predicate(
    "white",
    labClose(faceLikenessSrgbToLab(255, 255, 255), [100, 0, 0]),
  );
  TestValidator.predicate(
    "black",
    labClose(faceLikenessSrgbToLab(0, 0, 0), [0, 0, 0]),
  );
  TestValidator.predicate(
    "red",
    labClose(
      faceLikenessSrgbToLab(255, 0, 0),
      [53.2408, 80.0925, 67.2032],
      2e-3,
    ),
  );
  TestValidator.predicate(
    "dark grey",
    labClose(faceLikenessSrgbToLab(3, 3, 3), [0.8226, 0, 0], 2e-3),
  );

  const image = createFaceLikenessImage();
  const points = createFaceLikenessLandmarks();
  const hair = createFaceLikenessMask(110);
  const skin = faceLikenessSrgbToLab(...FACE_LIKENESS_SKIN);
  const cheek = faceLikenessCheekColour(image, points, "right", hair)!;
  TestValidator.predicate("cheek is skin", labClose(cheek.lab, skin));
  TestValidator.predicate(
    "cheek disc area",
    cheek.pixels > 300 && cheek.pixels < 330,
  );
  const iris = faceLikenessSrgbToLab(...FACE_LIKENESS_IRIS);
  const right = faceLikenessIrisColour(image, points, 0)!;
  const left = faceLikenessIrisColour(image, points, 1)!;
  TestValidator.equals(
    "iris sides",
    [right.side, left.side],
    ["right", "left"],
  );
  TestValidator.predicate(
    "iris colour",
    labClose(right.colour!.lab, iris) && labClose(left.colour!.lab, iris),
  );
  const hairColour = faceLikenessHairColour(image, hair, {
    x0: 0,
    y0: 0,
    x1: 300,
    y1: 300,
  })!;
  TestValidator.predicate(
    "hair colour",
    labClose(hairColour.lab, faceLikenessSrgbToLab(...FACE_LIKENESS_HAIR)),
  );
  TestValidator.equals("hair pixels", hairColour.pixels, 300 * 110);

  TestValidator.equals(
    "cheek hidden by hair",
    faceLikenessCheekColour(image, points, "left", createFaceLikenessMask(300)),
    null,
  );
  const wandering = points.map(
    (point, index): FaceLikenessPoint => (index === 468 ? [150, 250] : point),
  );
  TestValidator.equals(
    "iris outside apertures",
    faceLikenessIrisColour(image, wandering, 0),
    null,
  );
  const centre = points[468]!;
  const hidden = points.map(
    (point, index): FaceLikenessPoint =>
      index >= 469 && index <= 472
        ? [
            centre[0] + 3 * (point[0] - centre[0]),
            centre[1] + 3 * (point[1] - centre[1]),
          ]
        : point,
  );
  const covered = faceLikenessIrisColour(image, hidden, 0)!;
  TestValidator.predicate(
    "iris under the lids",
    covered.side === "right" && covered.colour === null,
  );

  TestValidator.predicate(
    "malformed pixels",
    throwsError(
      () =>
        faceLikenessSampleColour(
          { width: 2, height: 2, rgb: new Uint8Array(4) },
          () => true,
          { x0: 0, y0: 0, x1: 2, y1: 2 },
        ),
      "three bytes",
    ),
  );
  TestValidator.predicate(
    "exclusion frame",
    throwsError(
      () =>
        faceLikenessCheekColour(
          image,
          points,
          "left",
          createFaceLikenessMask(1, 10, 10),
        ),
      "exclusion mask",
    ),
  );
  TestValidator.predicate(
    "hair frame",
    throwsError(
      () =>
        faceLikenessHairColour(image, createFaceLikenessMask(1, 10, 10), {
          x0: 0,
          y0: 0,
          x1: 1,
          y1: 1,
        }),
      "hair mask",
    ),
  );
  const square: FaceLikenessPoint[] = [
    [0, 0],
    [4, 0],
    [4, 4],
    [0, 4],
  ];
  TestValidator.predicate("inside", faceLikenessInsidePolygon(square, 2, 2));
  TestValidator.predicate("outside", !faceLikenessInsidePolygon(square, 5, 2));
};
