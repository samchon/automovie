import { TestValidator } from "@nestia/e2e";

import {
  FACE_LIKENESS_VERMILION,
  faceLikenessLipColour,
  faceLikenessSrgbToLab,
} from "../../../scripts/face-review/faceLikenessColour";
import type { FaceLikenessPoint } from "../../../scripts/face-review/faceLikenessGeometry";

/**
 * A 100 x 60 image: rows 10 to 28 red (the upper vermilion), rows 32 to 50
 * blue (the lower), grey elsewhere. The commissures sit at (10, 30) and
 * (90, 30), the inner corners at (12, 30) and (88, 30); the upper lip's
 * outer contour runs along y 10 and its seam along y 28, the lower lip's
 * seam along y 32 and its outer contour along y 50.
 */
const face = () => {
  const rgb = new Uint8Array(100 * 60 * 3);
  for (let y = 0; y < 60; ++y)
    for (let x = 0; x < 100; ++x)
      rgb.set(
        y >= 10 && y < 28
          ? [200, 40, 40]
          : y >= 32 && y < 50
            ? [40, 40, 200]
            : [128, 128, 128],
        3 * (100 * y + x),
      );
  const points: FaceLikenessPoint[] = new Array(478).fill([0, 0]);
  const place = (
    indices: readonly number[],
    outerY: number,
    innerY: number,
  ) => {
    // commissure, 9 outer points, commissure, inner corner, 9 inner, corner
    indices.forEach((index, k) => {
      if (k === 0) points[index] = [10, 30];
      else if (k <= 9) points[index] = [10 + 8 * k, outerY];
      else if (k === 10) points[index] = [90, 30];
      else if (k === 11) points[index] = [88, 30];
      else if (k <= 20) points[index] = [90 - 8 * (k - 11), innerY];
      else points[index] = [12, 30];
    });
  };
  place(FACE_LIKENESS_VERMILION.upper, 10, 28);
  place(FACE_LIKENESS_VERMILION.lower, 50, 32);
  return { image: { width: 100, height: 60, rgb }, points };
};

/**
 * Lip vermilion samples.
 * Scenarios:
 * 1. The upper lip's outline encloses the red band and reads red; the lower
 *    lip's encloses the blue band and reads blue.
 * 2. An outline collapsed to a point encloses no pixel and gives no sample.
 */
export const test_subject_face_likeness_lips = (): void => {
  const { image, points } = face();
  const close = (a: readonly number[], b: readonly number[]) =>
    a.every((v, i) => Math.abs(v - b[i]!) < 1e-9);
  TestValidator.predicate(
    "vermilion",
    close(
      faceLikenessLipColour(image, points, "upper")!.lab,
      faceLikenessSrgbToLab(200, 40, 40),
    ) &&
      close(
        faceLikenessLipColour(image, points, "lower")!.lab,
        faceLikenessSrgbToLab(40, 40, 200),
      ),
  );
  const collapsed = points.map((): FaceLikenessPoint => [5, 5]);
  TestValidator.equals(
    "empty",
    faceLikenessLipColour(image, collapsed, "upper"),
    null,
  );
};
