import { TestValidator } from "@nestia/e2e";

import {
  faceExpressionObservable,
  transferFaceExpression,
} from "../../../scripts/face-review/faceExpressionTransfer";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Expression transfer through the shared calibration.
 * Scenarios:
 * 1. A photograph reading 0.3 over an identity resting at 0.1 asks for an
 *    increment of 0.2, read back through the curve between its samples.
 * 2. A score under the rest reading is weight zero; one past the curve's
 *    end is held at one.
 * 3. A channel not observable is not transferred; a channel the photograph
 *    lacks is absent.
 * 4. A dip in the curve is flattened by the running maximum.
 * 5. Observability: a unit whose span reaches its photographs' 2-sigma
 *    spread passes, a unit narrower than it fails, and a left/right pair
 *    passes or fails together on its mean; fewer than two photographs and a
 *    calibration without its rest score refuse.
 */
export const test_subject_face_expression_transfer = (): void => {
  const calibration = {
    smile: { weights: [0, 0.5, 1], scores: [0.1, 0.2, 0.5] },
    weak: { weights: [0, 1], scores: [0, 0.02] },
    dip: { weights: [0, 0.5, 0.75, 1], scores: [0, 0.4, 0.3, 0.6] },
    gone: { weights: [0, 1], scores: [0, 0.5] },
  };
  const observable = ["smile", "dip", "gone"];
  const rows = (photo: Record<string, number>, rest: Record<string, number>) =>
    Object.fromEntries(
      transferFaceExpression({ calibration, observable, photo, rest }).map(
        (one) => [one.channel, one],
      ),
    );
  const read = rows(
    { smile: 0.3, weak: 0.5, dip: 0.5 },
    { smile: 0.1, weak: 0, dip: 0 },
  );
  // Increment 0.2 lies between 0.1 at 1/2 and 0.4 at 1: weight 2/3.
  TestValidator.predicate(
    "interpolated",
    nclose(read.smile!.weight, 2 / 3, 1e-9),
  );
  TestValidator.equals("unobservable", read.weak!.status, "unobservable");
  TestValidator.equals("absent", read.gone!.status, "absent");
  // 0.5 on the flattened dip curve (0, .4, .4, .6) lies between 3/4 and 1.
  TestValidator.predicate(
    "running maximum",
    nclose(read.dip!.weight, 0.875, 1e-9),
  );
  const low = rows({ smile: 0.05, dip: 0.9 }, { smile: 0.1, dip: 0 });
  TestValidator.predicate(
    "below and beyond",
    low.smile!.weight === 0 &&
      low.dip!.weight === 1 &&
      low.dip!.status === "held",
  );

  // Photographs: wide reads 0 and 0.2 (2-sigma spread 0.283), narrow reads
  // 0 and 0.1 (0.141); the pair's left spans 0.3 and right 0.1 against
  // spreads of 0.141 each, so its mean span 0.2 passes both sides.
  const curves = {
    wide: { weights: [0, 1], scores: [0, 0.2] },
    narrow: { weights: [0, 1], scores: [0, 0.2] },
    pairLeft: { weights: [0, 1], scores: [0, 0.3] },
    pairRight: { weights: [0, 1], scores: [0, 0.1] },
  };
  const photographs = [
    { wide: 0, narrow: 0, pairLeft: 0, pairRight: 0 },
    { wide: 0.2, narrow: 0.1, pairLeft: 0.1, pairRight: 0.1 },
  ];
  TestValidator.equals(
    "observable",
    faceExpressionObservable(curves, photographs),
    ["narrow", "pairLeft", "pairRight"],
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => faceExpressionObservable(curves, photographs.slice(0, 1)),
      "two photographs",
    ) &&
      throwsError(
        () =>
          transferFaceExpression({
            calibration: { x: { weights: [0.5, 1], scores: [0, 1] } },
            observable: ["x"],
            photo: {},
            rest: {},
          }),
        "rest score",
      ),
  );
};
