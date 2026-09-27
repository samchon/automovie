import { TestValidator } from "@nestia/e2e";

import {
  FACE_BROW_CONTOURS,
  FACE_BROW_TRAVEL,
  faceBrowCover,
  faceBrowUnobservable,
} from "../../../scripts/face-review/faceBrowCover";
import { nclose } from "../internal/predicates";

/**
 * A fringe over a brow hides its raise.
 * Scenarios:
 * 1. On a 100 x 100 image with the eyes' outer corners 50 apart and every
 *    brow contour landmark at y 40, the samples sit 3.5, 7, 10.5 and 14
 *    pixels above: hair filling rows 0-37 covers all four on the subject's
 *    right brow (the image's left half) and hair only in rows 30-35, a
 *    thick brow's own band, covers one in four on its left; a half-size
 *    mask is read at half the coordinates; a sample off the image, on any
 *    side, is not hair.
 * 2. More than half covered hides that side's outer raise and lowering and
 *    the inner raise; half or less on both sides hides nothing.
 */
export const test_subject_face_brow_cover = (): void => {
  const landmarks: number[][] = Array.from({ length: 468 }, () => [0, 0]);
  landmarks[33] = [25, 50];
  landmarks[263] = [75, 50];
  FACE_BROW_CONTOURS.right.forEach((i, k) => (landmarks[i] = [10 + 5 * k, 40]));
  FACE_BROW_CONTOURS.left.forEach((i, k) => (landmarks[i] = [60 + 5 * k, 40]));
  const mask = (size: number) => {
    const data = new Uint8Array(size * size);
    const scale = size / 100;
    for (let y = 0; y < size; ++y)
      for (let x = 0; x < size; ++x) {
        const [X, Y] = [x / scale, y / scale];
        if ((X < 50 && Y <= 37) || (X >= 50 && Y >= 30 && Y <= 35))
          data[y * size + x] = 1;
      }
    return { width: size, height: size, data };
  };
  const full = faceBrowCover({
    hair: mask(100),
    landmarks,
    width: 100,
    height: 100,
  });
  const half = faceBrowCover({
    hair: mask(50),
    landmarks,
    width: 100,
    height: 100,
  });
  const high = landmarks.map((one) => [one[0]!, one[1]! - 30]);
  const off = faceBrowCover({
    hair: mask(100),
    landmarks: high,
    width: 100,
    height: 100,
  });
  const shifted = (dx: number, dy: number) =>
    faceBrowCover({
      hair: mask(100),
      landmarks: landmarks.map((one) => [one[0]! + dx, one[1]! + dy]),
      width: 100,
      height: 100,
    });
  TestValidator.predicate(
    "outside the image",
    [shifted(-200, 0), shifted(200, 0), shifted(0, 200)].every(
      (one) => one.left === 0 && one.right === 0,
    ),
  );
  TestValidator.predicate(
    "cover",
    nclose(FACE_BROW_TRAVEL * 50, 3.5, 1e-12) &&
      full.right === 1 &&
      full.left === 0.25 &&
      half.right === 1 &&
      half.left === 0.25 &&
      off.right < 1,
  );
  TestValidator.equals(
    "units",
    [
      faceBrowUnobservable({ left: 0.75, right: 0.25 }),
      faceBrowUnobservable({ left: 0.5, right: 0.5 }),
    ],
    [["browOuterUpLeft", "browDownLeft", "browInnerUp"], []],
  );
};
