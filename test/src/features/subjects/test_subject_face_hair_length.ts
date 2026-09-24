import { TestValidator } from "@nestia/e2e";

import {
  faceHairDropIndex,
  faceHairFringeCoverage,
  faceHairHeadMask,
  faceHairLowestRow,
  faceHairShoulderDrop,
} from "../../../scripts/face-review/faceHairLength";
import { faceHairVisibleMask } from "../../../scripts/face-review/faceHairView";
import { faceShapeFitView } from "../../../scripts/face-review/faceShapeFitCamera";
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
 * 3. The fringe coverage is the covered share of the rectangle between the
 *    eye corners from the forehead top down to the higher upper lid: the
 *    head component's column 2 over rows 1 to 3 of a 4 x 3 rectangle is a
 *    third; an empty rectangle gives none.
 * 4. Seen from the front, hair a centimetre in front of a skin plane is
 *    visible over its own pixels and the same hair a centimetre behind it
 *    is hidden.
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
  const lid = [0, 4] as const;
  TestValidator.predicate(
    "fringe",
    nclose(
      faceHairFringeCoverage({
        mask: head,
        top: [0, 1],
        eyes: [
          [1, 0],
          [4, 0],
        ],
        lids: [lid, lid],
      })!,
      3 / 9,
      1e-12,
    ) &&
      faceHairFringeCoverage({
        mask: head,
        top: [0, 4],
        eyes: [
          [1, 0],
          [4, 0],
        ],
        lids: [lid, lid],
      }) === null,
  );
  const view = faceShapeFitView(
    { yaw: 0, pitch: 0, distance: 2, target: [0, 0, 0], fov: 10 },
    100,
  );
  const square = (x0: number, x1: number, z: number) => ({
    positions: [x0, -0.1, z, x1, -0.1, z, x1, 0.1, z, x0, 0.1, z],
    indices: [0, 1, 2, 0, 2, 3],
  });
  const count = (z: number) =>
    faceHairVisibleMask({
      view,
      skin: square(-0.15, 0.15, 0),
      hair: [square(0, 0.05, z)],
      slack: 0.001,
    }).data.reduce((sum, one) => sum + one, 0);
  TestValidator.predicate("visible", count(0.01) > 0 && count(-0.01) === 0);
  const below = (rows?: number) =>
    faceHairVisibleMask({
      view,
      skin: square(-0.15, 0.15, 0),
      hair: [
        {
          positions: [0, -0.5, 0.01, 0.05, -0.5, 0.01, 0.05, -0.4, 0.01],
          indices: [0, 1, 2],
        },
      ],
      slack: 0.001,
      rows,
    });
  TestValidator.predicate(
    "below the frame",
    below().height === 100 &&
      below().data.every((one) => one === 0) &&
      below(300).height === 300 &&
      below(300).data.some((one) => one !== 0),
  );
  const norms = {
    male: { acromion: { subjects: 3, mean: 80 } },
    female: { acromion: { subjects: 1, mean: 70 } },
  };
  TestValidator.predicate(
    "shoulder",
    nclose(faceHairShoulderDrop(norms, "male"), 0.08, 1e-12) &&
      nclose(faceHairShoulderDrop(norms, "female"), 0.07, 1e-12) &&
      nclose(faceHairShoulderDrop(norms, null), 0.0775, 1e-12) &&
      throwsError(() =>
        faceHairShoulderDrop(
          {
            male: { acromion: { subjects: 0, mean: 80 } },
            female: { acromion: { subjects: 0, mean: 70 } },
          },
          null,
        ),
      ),
  );
};
