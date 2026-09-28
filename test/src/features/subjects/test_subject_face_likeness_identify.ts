import { TestValidator } from "@nestia/e2e";

import type { FaceLikenessPoint } from "../../../scripts/face-review/faceLikenessGeometry";
import { identifyFaceLikeness } from "../../../scripts/face-review/faceLikenessIdentify";
import { createFaceLikenessLandmarks } from "../internal/createFaceLikenessFixture";

/** The fixture face with its mouth and chin moved down by `drop` pixels. */
const person = (drop: number): FaceLikenessPoint[] =>
  createFaceLikenessLandmarks().map(([x, y], k) =>
    y > 170 && k < 468 ? [x, y + drop] : [x, y],
  );

/**
 * Renders ranked among the population's photographs.
 * Scenarios:
 * 1. Three people differing in lower-face length, each rendered with half a
 *    pixel of noise, are all nearest to their own photographs: three
 *    identified, own residuals below the other-photograph and
 *    photograph-to-photograph medians.
 * 2. A render of the second person labelled as the first ranks the first
 *    photograph second, so two of three are identified.
 * 3. A single subject has no other photograph: rank 1 and null nearest
 *    other and medians.
 */
export const test_subject_face_likeness_identify = (): void => {
  const photos = [0, 6, 12].map(person);
  const renders = photos.map((photo) =>
    photo.map(([x, y], k): FaceLikenessPoint => [x + 0.5 * Math.sin(k), y]),
  );
  const result = identifyFaceLikeness(
    photos.map((photo, i) => ({
      subject: `p${i}`,
      render: renders[i]!,
      photo,
    })),
  );
  TestValidator.equals(
    "ranks",
    result.rows.map((row) => row.rank),
    [1, 1, 1],
  );
  TestValidator.equals("identified", result.identified, 3);
  TestValidator.predicate(
    "own below other and photograph spread",
    result.ownMedian! < result.otherMedian! &&
      result.ownMedian! < result.photoMedian!,
  );
  const swapped = identifyFaceLikeness([
    { subject: "p0", render: renders[1]!, photo: photos[0]! },
    { subject: "p1", render: renders[1]!, photo: photos[1]! },
    { subject: "p2", render: renders[2]!, photo: photos[2]! },
  ]);
  TestValidator.equals(
    "mislabelled render ranks second",
    swapped.rows[0]!.rank,
    2,
  );
  TestValidator.equals("two identified", swapped.identified, 2);
  const alone = identifyFaceLikeness([
    { subject: "p0", render: renders[0]!, photo: photos[0]! },
  ]);
  TestValidator.equals(
    "single subject",
    [
      alone.rows[0]!.rank,
      alone.rows[0]!.nearestOther,
      alone.otherMedian,
      alone.photoMedian,
    ],
    [1, null, null, null],
  );
};
