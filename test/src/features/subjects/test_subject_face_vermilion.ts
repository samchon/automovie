import { TestValidator } from "@nestia/e2e";

import type { FaceLikenessPoint } from "../../../scripts/face-review/faceLikenessGeometry";
import { measureFaceLikenessVermilion } from "../../../scripts/face-review/faceLikenessVermilion";
import { throwsError } from "../internal/predicates";

const SKIN = [220, 175, 155] as const;
const SHADOW = [150, 119, 105] as const;
const LIP = [205, 95, 105] as const;
const SEAM = [80, 40, 40] as const;

/**
 * A 200 px square portrait: skin, the upper vermilion on rows `upper` to 99,
 * the seam on row 100, the lower vermilion on rows 101 to 113 and the
 * shadow under it on rows 115 to 121 (the skin darkened, its chroma kept
 * nearly), optionally grey or turned upside down.
 */
const image = (
  options: { upper?: number; grey?: boolean; flip?: boolean } = {},
) => {
  const rgb = new Uint8Array(200 * 200 * 3);
  for (let y = 0; y < 200; ++y)
    for (let x = 0; x < 200; ++x) {
      const colour =
        y >= (options.upper ?? 90) && y <= 99
          ? LIP
          : y === 100
            ? SEAM
            : y >= 101 && y <= 113
              ? LIP
              : y >= 115 && y <= 121
                ? SHADOW
                : SKIN;
      const row = options.flip === true ? 199 - y : y;
      const grey = (colour[0] + colour[1] + colour[2]) / 3;
      for (let c = 0; c < 3; ++c)
        rgb[3 * (row * 200 + x) + c] =
          options.grey === true ? grey : colour[c]!;
    }
  return { width: 200, height: 200, rgb };
};

/** Eye corners on row 40 (inter-ocular 60), the detector's lip landmarks. */
const landmarks = (
  overrides: Record<number, FaceLikenessPoint> = {},
): FaceLikenessPoint[] => {
  const points: FaceLikenessPoint[] = [];
  points[33] = [60, 40];
  points[133] = [80, 40];
  points[362] = [120, 40];
  points[263] = [140, 40];
  points[0] = [100, 92];
  points[13] = [100, 99];
  points[14] = [100, 101];
  points[17] = [100, 110];
  for (const [k, p] of Object.entries(overrides)) points[Number(k)] = p;
  return points;
};

/**
 * The vermilion's borders from the midline's chroma.
 * Scenarios:
 * 1. Labrale superius on row 90 and inferius between rows 113 and 114 are
 *    found from the skin's side, though the detector's landmarks sit on
 *    rows 92 and 110, and the shadow under the lower lip, darker but of the
 *    skin's chroma, does not count as lip.
 * 2. Upside down the frame turns with the face.
 * 3. A grey portrait reads neither border; a window that starts on the lip
 *    (the detector's lower landmark 7 px into it) or holds none (an upper
 *    vermilion thinner than the window reaches) reads that border only not.
 * 4. A missing landmark and coincident eyes refuse.
 */
export const test_subject_face_vermilion = (): void => {
  const read = measureFaceLikenessVermilion(image(), landmarks());
  const near = (p: FaceLikenessPoint | null, x: number, y: number) =>
    p !== null && Math.abs(p[0] - x) <= 1 && Math.abs(p[1] - y) <= 1;
  TestValidator.predicate(
    "borders",
    near(read.superius, 100, 90) && near(read.inferius, 100, 113.5),
  );
  const flipped = measureFaceLikenessVermilion(
    image({ flip: true }),
    landmarks().map((p) => [p[0], 199 - p[1]] as const),
  );
  TestValidator.predicate(
    "upside down",
    near(flipped.superius, 100, 199 - 90) &&
      near(flipped.inferius, 100, 199 - 113.5),
  );
  const grey = measureFaceLikenessVermilion(image({ grey: true }), landmarks());
  const high = measureFaceLikenessVermilion(
    image(),
    landmarks({ 17: [100, 103] }),
  );
  const thin = measureFaceLikenessVermilion(image({ upper: 96 }), landmarks());
  TestValidator.predicate(
    "unread",
    grey.superius === null &&
      grey.inferius === null &&
      high.inferius === null &&
      near(high.superius, 100, 90) &&
      thin.superius === null &&
      near(thin.inferius, 100, 113.5),
  );
  const missing = landmarks().map((p, k) => (k === 17 ? undefined! : p));
  const coincident = landmarks({ 362: [60, 40], 263: [80, 40] });
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => measureFaceLikenessVermilion(image(), missing),
      "Landmark 17 is missing",
    ) &&
      throwsError(
        () => measureFaceLikenessVermilion(image(), coincident),
        "eyes coincide",
      ),
  );
};
