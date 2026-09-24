import { TestValidator } from "@nestia/e2e";

import {
  faceHairDropIndex,
  faceHairHeadMask,
  faceHairLowestRow,
} from "../../../scripts/face-review/faceHairLength";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A 10 x 10 mask: a head component from row 1 down to row 6 in column 2, and
 * a collar component in rows 8 and 9 of column 7 that never reaches above
 * row 3.
 */
const mask = () => {
  const data = new Uint8Array(100);
  for (let y = 1; y <= 6; ++y) data[10 * y + 2] = 1;
  data[80 + 7] = 1;
  data[90 + 7] = 1;
  return { width: 10, height: 10, data };
};

/**
 * The hair drop index.
 * Scenarios:
 * 1. The head mask keeps the component that reaches above the brows (row 3)
 *    and drops the collar; its lowest row is 6, the whole mask's 9.
 * 2. With the chin at row 4 and the eye corners 2 apart the drop is
 *    (6 - 4) / 2 = 1; hair cut by the frame or absent has no index; eye
 *    corners that coincide refuse.
 */
export const test_subject_face_hair_length = (): void => {
  const head = faceHairHeadMask(mask(), 3);
  TestValidator.predicate(
    "head hair",
    faceHairLowestRow(head) === 6 &&
      faceHairLowestRow(mask()) === 9 &&
      head.data[87] === 0 &&
      faceHairLowestRow({ width: 2, height: 2, data: new Uint8Array(4) }) ===
        null,
  );
  const eyes = [
    [0, 0],
    [2, 0],
  ] as const;
  TestValidator.predicate(
    "drop",
    nclose(
      faceHairDropIndex({ chin: [0, 4], eyes, lowest: 6, clipped: false })!,
      1,
      1e-12,
    ) &&
      faceHairDropIndex({ chin: [0, 4], eyes, lowest: 9, clipped: true }) ===
        null &&
      faceHairDropIndex({
        chin: [0, 4],
        eyes,
        lowest: null,
        clipped: false,
      }) === null &&
      throwsError(
        () =>
          faceHairDropIndex({
            chin: [0, 4],
            eyes: [
              [1, 1],
              [1, 1],
            ],
            lowest: 6,
            clipped: false,
          }),
        "distinct eye corners",
      ),
  );
};
