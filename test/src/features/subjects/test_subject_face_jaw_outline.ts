import { TestValidator } from "@nestia/e2e";

import type { FaceLikenessPoint } from "../../../scripts/face-review/faceLikenessGeometry";
import {
  faceLikenessJawLandmarks,
  measureFaceLikenessJawOutline,
} from "../../../scripts/face-review/faceLikenessJawOutline";
import { throwsError } from "../internal/predicates";

/**
 * A 200 px square mask: the face an ellipse about (100, 90) with semi-axes
 * 60 across and 80 down, its mouth open (a hole about stomion), and another
 * face-skin blob at the right edge that does not touch it.
 */
const mask = (
  options: { cut?: number; half?: boolean; flip?: boolean } = {},
) => {
  const data = new Uint8Array(200 * 200);
  for (let y = 0; y < 200; ++y)
    for (let x = 0; x < 200; ++x) {
      const inFace =
        ((x - 100) / 60) ** 2 + ((y - 90) / 80) ** 2 <= 1 &&
        y < (options.cut ?? 200) &&
        !(options.half === true && x >= 100 && y >= 155 && y <= 165);
      const mouth = x >= 85 && x <= 115 && y >= 125 && y <= 135;
      const other = x >= 170 && y >= 120 && y <= 140;
      data[(options.flip === true ? 199 - y : y) * 200 + x] =
        (inFace && !mouth) || other ? 1 : 0;
    }
  return { width: 200, height: 200, data };
};

/** Eye corners on y = 70 (inter-ocular 60), stomion (100, 130), cheilia on its level, nasal tip (100, 100). */
const landmarks = (omit?: number): FaceLikenessPoint[] => {
  const points: FaceLikenessPoint[] = [];
  points[33] = [60, 70];
  points[133] = [80, 70];
  points[362] = [120, 70];
  points[263] = [140, 70];
  points[13] = [100, 128];
  points[14] = [100, 132];
  points[61] = [80, 130];
  points[291] = [120, 130];
  points[4] = [100, 100];
  return points.map((one, k) => (k === omit ? undefined! : one));
};

/** The same landmarks upside down (y mirrored about 99.5). */
const flipped = (): FaceLikenessPoint[] =>
  landmarks().map((one) => [one[0], 199 - one[1]] as const);

/**
 * The jaw's outline from a face-skin mask.
 * Scenarios:
 * 1. Menton is the face's lowest midline pixel (y 170), found from below
 *    past the open mouth; the outline at the mouth line (y 130) and three
 *    quarters of the way to menton (y 160) lies on the ellipse (half-widths
 *    52.0 and 29.0), the blob at the right edge being another region; the
 *    points take landmark indices 470 to 474.
 * 2. Upside down the frame turns with the face: menton at y 29.
 * 3. A nasal tip outside the face, a face ending above stomion and one
 *    with no right side at a level read nothing; a missing landmark
 *    and coincident eyes refuse.
 */
export const test_subject_face_jaw_outline = (): void => {
  const outline = measureFaceLikenessJawOutline(mask(), landmarks())!;
  const near = (p: FaceLikenessPoint, x: number, y: number) =>
    Math.abs(p[0] - x) <= 1.5 && Math.abs(p[1] - y) <= 1.5;
  TestValidator.predicate(
    "menton and outline",
    near(outline.menton, 100, 170) &&
      outline.levels.length === 2 &&
      near(outline.levels[0]![0], 48.04, 130) &&
      near(outline.levels[0]![1], 151.96, 130) &&
      near(outline.levels[1]![0], 100 - 29.05, 160) &&
      near(outline.levels[1]![1], 100 + 29.05, 160) &&
      faceLikenessJawLandmarks(outline)
        .map(([landmark]) => landmark)
        .join() === "470,471,472,473,474" &&
      faceLikenessJawLandmarks(outline)[4]![1] === outline.levels[1]![1],
  );
  TestValidator.predicate(
    "upside down",
    near(
      measureFaceLikenessJawOutline(mask({ flip: true }), flipped())!.menton,
      100,
      29,
    ),
  );
  const off = landmarks();
  off[4] = [5, 5];
  const coincident = landmarks();
  coincident[362] = [60, 70];
  coincident[263] = [80, 70];
  const missing = landmarks(61);
  TestValidator.predicate(
    "nothing to read, refusals",
    measureFaceLikenessJawOutline(mask(), off) === null &&
      measureFaceLikenessJawOutline(mask({ cut: 125 }), landmarks()) === null &&
      measureFaceLikenessJawOutline(mask({ half: true }), landmarks()) ===
        null &&
      throwsError(
        () => measureFaceLikenessJawOutline(mask(), missing),
        "Landmark 61 is missing",
      ) &&
      throwsError(
        () => measureFaceLikenessJawOutline(mask(), coincident),
        "eyes coincide",
      ),
  );
};
