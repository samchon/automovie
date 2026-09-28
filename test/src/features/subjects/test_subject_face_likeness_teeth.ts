import { TestValidator } from "@nestia/e2e";

import type { IFaceLikenessImage } from "../../../scripts/face-review/faceLikenessColour";
import type { FaceLikenessPoint } from "../../../scripts/face-review/faceLikenessGeometry";
import {
  faceLikenessTeethLengths,
  measureFaceLikenessTeeth,
} from "../../../scripts/face-review/faceLikenessTeeth";
import { nclose, throwsError } from "../internal/predicates";

const SKIN = [200, 150, 120] as const;
const LIP = [180, 60, 70] as const;
const TOOTH = [235, 230, 220] as const;
const DARK = [30, 15, 20] as const;

/** A 200 x 200 portrait whose rows from 100 are painted by `rows`. */
const mouth = (
  rows: readonly (readonly [number, readonly [number, number, number]])[],
): IFaceLikenessImage => {
  const rgb = new Uint8Array(200 * 200 * 3);
  for (let y = 0; y < 200; ++y) {
    let colour: readonly number[] = SKIN;
    for (const [from, paint] of rows) if (y >= from) colour = paint;
    for (let x = 0; x < 200; ++x) rgb.set(colour, 3 * (200 * y + x));
  }
  return { width: 200, height: 200, rgb };
};

/**
 * Eye centres 80 pixels apart at row 50 (`spread` scales their distance
 * from the midline), lips at rows 100, 120, 151 and 170, shifted by `shift`.
 */
const landmarks = (
  inner: [number, number] = [120, 151],
  mirrored = false,
  spread = 1,
  shift = 0,
): FaceLikenessPoint[] => {
  const points: FaceLikenessPoint[] = new Array(478).fill([0, 0]);
  const eye = (x: number): FaceLikenessPoint => [
    100 + (mirrored ? -1 : 1) * spread * (x - 100),
    50,
  ];
  points[33] = eye(50);
  points[133] = eye(70);
  points[362] = eye(130);
  points[263] = eye(150);
  points[0] = [100, 100 + shift];
  points[13] = [100, inner[0] + shift];
  points[14] = [100, inner[1] + shift];
  points[17] = [100, 170 + shift];
  return points;
};

const at = (point: FaceLikenessPoint | undefined, y: number): boolean =>
  point !== undefined &&
  nclose(point[0], 100, 1e-9) &&
  Math.abs(point[1] - y) <= 0.5;

/**
 * Incisal edges read along the mouth's midline.
 * Scenarios:
 * 1. Upper teeth, a three-row dark gap (0.0375 inter-ocular) and lower teeth
 *    between vermilion bands: the upper edge is at the upper run's end
 *    (row 139.5), the lower edge at the lower run's start (row 142.5), both
 *    exposures and the gap are reported, and down points at the mouth even
 *    with the eyes given in mirrored order.
 * 2. A one-row gap is the contact shadow: the lower edge is at or above the
 *    lower run's start.
 * 3. Dark below the upper teeth: the lower edge is at or below the lower
 *    inner lip (row 151).
 * 4. Teeth from lip to lip: the upper edge is only known to be at or below
 *    the run's start and the lower edge is unknown.
 * 5. Only a run nearer the lower lip: the upper edge is at or above the
 *    upper inner lip and the lower edge is at the run's start.
 * 6. With the eyes 180 pixels apart a one-row highlight on the upper lip
 *    (0.0056 inter-ocular) is dropped and the upper edge stays at row 139.5.
 * 7. Touching lips, a monochrome mouth, an open mouth without teeth and a
 *    mouth below the image give nothing; a missing landmark and coincident
 *    eyes refuse.
 * 8. For comparison an arch hidden in a mouth that shows teeth has length 0,
 *    a gap that does not show and an unmeasured mouth are null.
 */
export const test_subject_face_likeness_teeth = (): void => {
  const open = [
    [100, LIP],
    [120, TOOTH],
    [140, DARK],
    [143, TOOTH],
    [151, LIP],
    [171, SKIN],
  ] as const;
  for (const mirrored of [false, true]) {
    const teeth = measureFaceLikenessTeeth(
      mouth(open),
      landmarks(undefined, mirrored),
    )!;
    TestValidator.predicate(
      `down ${mirrored}`,
      nclose(teeth.down[0], 0, 1e-12) && nclose(teeth.down[1], 1, 1e-12),
    );
    TestValidator.predicate(
      `open edges ${mirrored}`,
      teeth.upper!.relation === "at" &&
        at(teeth.upper!.point, 139.5) &&
        teeth.lower!.relation === "at" &&
        at(teeth.lower!.point, 142.5),
    );
    TestValidator.predicate(
      `open lengths ${mirrored}`,
      nclose(teeth.upperExposure!, 20 / 80, 0.01) &&
        nclose(teeth.lowerExposure!, 8 / 80, 0.01) &&
        nclose(teeth.gap!, 3 / 80, 0.01),
    );
  }

  const contact = measureFaceLikenessTeeth(
    mouth([
      [100, LIP],
      [120, TOOTH],
      [140, DARK],
      [141, TOOTH],
      [151, LIP],
      [171, SKIN],
    ]),
    landmarks(),
  )!;
  TestValidator.predicate(
    "contact",
    contact.lower!.relation === "atOrAbove" && at(contact.lower!.point, 140.5),
  );

  const hidden = measureFaceLikenessTeeth(
    mouth([
      [100, LIP],
      [120, TOOTH],
      [140, DARK],
      [151, LIP],
      [171, SKIN],
    ]),
    landmarks(),
  )!;
  TestValidator.predicate(
    "lower behind the lip",
    hidden.upper!.relation === "at" &&
      hidden.lower!.relation === "atOrBelow" &&
      at(hidden.lower!.point, 151) &&
      hidden.lowerExposure === null &&
      hidden.gap === null,
  );

  const merged = measureFaceLikenessTeeth(
    mouth([
      [100, LIP],
      [120, TOOTH],
      [151, LIP],
      [171, SKIN],
    ]),
    landmarks(),
  )!;
  TestValidator.predicate(
    "lip to lip",
    merged.upper!.relation === "atOrBelow" &&
      at(merged.upper!.point, 119.5) &&
      merged.lower === null,
  );

  const lowerOnly = measureFaceLikenessTeeth(
    mouth([
      [100, LIP],
      [120, DARK],
      [140, TOOTH],
      [151, LIP],
      [171, SKIN],
    ]),
    landmarks(),
  )!;
  TestValidator.predicate(
    "lower only",
    lowerOnly.upper!.relation === "atOrAbove" &&
      at(lowerOnly.upper!.point, 120) &&
      lowerOnly.lower!.relation === "at" &&
      at(lowerOnly.lower!.point, 139.5) &&
      lowerOnly.upperExposure === null &&
      lowerOnly.gap === null,
  );

  const wide = measureFaceLikenessTeeth(
    mouth([
      [100, LIP],
      [118, TOOTH],
      [119, LIP],
      [120, TOOTH],
      [140, DARK],
      [143, TOOTH],
      [151, LIP],
      [171, SKIN],
    ]),
    landmarks(undefined, false, 2.25),
  )!;
  TestValidator.predicate(
    "highlight dropped",
    at(wide.upper!.point, 139.5) && nclose(wide.upperExposure!, 20 / 180, 0.01),
  );

  TestValidator.equals(
    "below the image",
    measureFaceLikenessTeeth(mouth(open), landmarks(undefined, false, 1, 150)),
    null,
  );
  TestValidator.equals(
    "touching lips",
    measureFaceLikenessTeeth(mouth(open), landmarks([120, 122])),
    null,
  );
  TestValidator.equals(
    "monochrome",
    measureFaceLikenessTeeth(
      mouth([
        [100, [120, 120, 120]],
        [120, TOOTH],
        [151, [120, 120, 120]],
        [171, SKIN],
      ]),
      landmarks(),
    ),
    null,
  );
  TestValidator.equals(
    "no teeth",
    measureFaceLikenessTeeth(
      mouth([
        [100, LIP],
        [120, DARK],
        [151, LIP],
        [171, SKIN],
      ]),
      landmarks(),
    ),
    null,
  );
  const missing = landmarks();
  missing[14] = undefined as unknown as FaceLikenessPoint;
  TestValidator.predicate(
    "missing landmark",
    throwsError(
      () => measureFaceLikenessTeeth(mouth(open), missing),
      "Landmark 14",
    ),
  );
  TestValidator.equals(
    "hidden arch reads zero",
    faceLikenessTeethLengths(lowerOnly),
    { upperExposure: 0, lowerExposure: lowerOnly.lowerExposure, gap: null },
  );
  TestValidator.equals("hidden lower arch", faceLikenessTeethLengths(hidden), {
    upperExposure: hidden.upperExposure,
    lowerExposure: 0,
    gap: null,
  });
  TestValidator.equals("unmeasured", faceLikenessTeethLengths(null), {
    upperExposure: null,
    lowerExposure: null,
    gap: null,
  });
  const blind = landmarks();
  blind[362] = blind[33]!;
  blind[263] = blind[133]!;
  TestValidator.predicate(
    "coincident eyes",
    throwsError(() => measureFaceLikenessTeeth(mouth(open), blind), "coincide"),
  );
};
