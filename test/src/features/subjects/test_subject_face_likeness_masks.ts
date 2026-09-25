import { TestValidator } from "@nestia/e2e";

import {
  type IFaceLikenessMask,
  faceLikenessHeadRegion,
  faceLikenessMaskBounds,
  faceLikenessMaskOverlap,
  faceLikenessPointBounds,
  faceLikenessUncoveredShare,
  warpFaceLikenessMask,
} from "../../../scripts/face-review/faceLikenessMasks";
import {
  createFaceLikenessLandmarks,
  createFaceLikenessMask,
} from "../internal/createFaceLikenessFixture";
import { throwsError } from "../internal/predicates";

const mask = (
  width: number,
  height: number,
  set: [number, number][],
): IFaceLikenessMask => {
  const data = new Uint8Array(width * height);
  for (const [x, y] of set) data[y * width + x] = 1;
  return { width, height, data };
};

/**
 * Hair silhouettes compared in the photograph frame.
 * Scenarios:
 * 1. A 2x2 render mask scaled by 2 into a 5x5 frame fills the matching 2x2
 *    blocks, covers exactly the 4x4 preimage of the render and leaves the
 *    fifth row and column uncovered; the source bytes are unchanged.
 * 2. Overlap counts only covered pixels: an uncovered reference pixel adds to
 *    neither side, and a reference mask entirely outside coverage has an
 *    empty union and a null IoU. A region clips the count; a region beyond
 *    the frame is clipped to it.
 * 3. The uncovered share of reference hair is the fraction outside coverage
 *    and null for an empty reference.
 * 4. The head region widens the fixture face (x and y 100..205) by 0.6 width
 *    sideways, 1.0 height upward (clipped at 0) and 0.2 downward.
 * 5. Mask bounds are exclusive at the far edge and null for an empty mask;
 *    point bounds of nothing refuse; mismatched or malformed masks refuse.
 */
export const test_subject_face_likeness_masks = (): void => {
  const source = mask(2, 2, [
    [0, 0],
    [1, 1],
  ]);
  const before = [...source.data];
  const warped = warpFaceLikenessMask(
    source,
    { a: 2, b: 0, tx: 0, ty: 0 },
    5,
    5,
  );
  const expected = mask(5, 5, [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 3],
  ]);
  TestValidator.equals(
    "warped mask",
    [...warped.mask.data],
    [...expected.data],
  );
  const covered = [...warped.covered.data];
  TestValidator.equals(
    "covered count",
    covered.reduce((sum, value) => sum + value, 0),
    16,
  );
  TestValidator.equals("fifth column uncovered", covered[4], 0);
  TestValidator.equals("fifth row uncovered", covered[20], 0);
  TestValidator.equals("source untouched", [...source.data], before);

  const reference = mask(5, 5, [
    [0, 0],
    [2, 0],
    [4, 4],
  ]);
  const overlap = faceLikenessMaskOverlap(
    reference,
    warped.mask,
    warped.covered,
  );
  TestValidator.equals("overlap", overlap, {
    intersection: 1,
    union: 9,
    reference: 2,
    render: 8,
    iou: 1 / 9,
  });
  TestValidator.equals(
    "region clips",
    faceLikenessMaskOverlap(reference, warped.mask, warped.covered, {
      x0: -3,
      y0: -3,
      x1: 2,
      y1: 1,
    }).iou,
    1 / 2,
  );
  const outside = mask(5, 5, [[4, 4]]);
  TestValidator.equals(
    "empty union",
    faceLikenessMaskOverlap(outside, mask(5, 5, []), warped.covered).iou,
    null,
  );
  TestValidator.equals(
    "uncovered share",
    faceLikenessUncoveredShare(reference, warped.covered),
    1 / 3,
  );
  TestValidator.equals(
    "empty reference",
    faceLikenessUncoveredShare(mask(5, 5, []), warped.covered),
    null,
  );

  TestValidator.equals(
    "head region",
    faceLikenessHeadRegion(createFaceLikenessLandmarks(), 300, 300),
    { x0: 37, y0: 0, x1: 268, y1: 226 },
  );
  TestValidator.equals(
    "mask bounds",
    faceLikenessMaskBounds(createFaceLikenessMask(3, 4, 5)),
    {
      x0: 0,
      y0: 0,
      x1: 4,
      y1: 3,
    },
  );
  TestValidator.equals(
    "empty mask bounds",
    faceLikenessMaskBounds(mask(3, 3, [])),
    null,
  );
  TestValidator.predicate(
    "no points",
    throwsError(() => faceLikenessPointBounds([]), "No points"),
  );
  TestValidator.predicate(
    "frame mismatch",
    throwsError(
      () => faceLikenessMaskOverlap(reference, mask(4, 5, []), warped.covered),
      "one frame",
    ),
  );
  TestValidator.predicate(
    "malformed mask",
    throwsError(
      () =>
        warpFaceLikenessMask(
          { width: 2, height: 2, data: new Uint8Array(3) },
          { a: 1, b: 0, tx: 0, ty: 0 },
          2,
          2,
        ),
      "one byte per pixel",
    ),
  );
  TestValidator.predicate(
    "non-integer mask",
    throwsError(
      () =>
        faceLikenessMaskBounds({
          width: 1.5,
          height: 2,
          data: new Uint8Array(3),
        }),
      "positive integer",
    ),
  );
};
