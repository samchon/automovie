import { TestValidator } from "@nestia/e2e";

import { measureCranialBreadthFrame } from "../../../scripts/face-review/measureCranialBreadthFrame";
import { throwsError } from "../internal/predicates";

/** Skin vertices: two scalp ones (the left one farther out), two auricle ones and one that is neither. */
const POSITIONS = [
  0.06,
  0.05,
  0.02, // 0: scalp
  -0.07,
  0.052,
  0.04, // 1: scalp, farthest from the midline
  0.08,
  0.03,
  0.05, // 2: auricle, lowest
  0.075,
  0.035,
  0.06, // 3: auricle, most anterior
  0.09,
  0.01,
  0.0, // 4: neither scalp nor auricle: never read
];
/** Brow cards: the farther one ends at x 0.05, depth 0.1. */
const BROWS = [0.02, 0.06, 0.12, -0.05, 0.058, 0.1, 0.03, 0.06, 0.11];

/**
 * The frame a cranial breadth control is laid out by, read on a skin.
 * Scenarios:
 * 1. The side, height and depth are those of the scalp vertex farthest from
 *    the midline whichever side it is on, the ear bottom and front are the lowest and most
 *    anterior auricle vertices and the brow's end is the brow vertex farthest from the midline,
 *    on its own side; a vertex that is neither scalp nor auricle is never
 *    read.
 * 2. No scalp, no auricle or no brow refuses, and so do ears that begin at or above
 *    the euryon, ears whose front lies behind the euryon and brows that reach
 *    the head's side.
 */
export const test_subject_cranial_breadth_frame = (): void => {
  const input = {
    positions: POSITIONS,
    scalp: [0, 1],
    auricles: [2, 3],
    brows: BROWS,
  };
  const frame = measureCranialBreadthFrame(input);
  TestValidator.equals("frame", frame, {
    side: 0.07,
    euryon: 0.052,
    depth: 0.04,
    earBottom: 0.03,
    earTop: 0.035,
    earFront: 0.06,
    browSide: 0.05,
    front: 0.1,
  });
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => measureCranialBreadthFrame({ ...input, scalp: [] }),
      "needs the scalp",
    ) &&
      throwsError(
        () => measureCranialBreadthFrame({ ...input, auricles: [] }),
        "needs the scalp",
      ) &&
      throwsError(
        () => measureCranialBreadthFrame({ ...input, brows: [] }),
        "needs the scalp",
      ) &&
      throwsError(
        () => measureCranialBreadthFrame({ ...input, auricles: [1] }),
        "ears begin below",
      ) &&
      throwsError(
        () => measureCranialBreadthFrame({ ...input, auricles: [0] }),
        "ears' front",
      ) &&
      throwsError(
        () =>
          measureCranialBreadthFrame({
            ...input,
            brows: [0.075, 0.06, 0.1],
          }),
        "inside the head's side",
      ) &&
      throwsError(
        () =>
          measureCranialBreadthFrame({
            ...input,
            brows: [0.05, 0.06, 0.05],
          }),
        "ahead of the ears",
      ),
  );
};
