import { TestValidator } from "@nestia/e2e";

import {
  faceExpressionCalibrationDocuments,
  faceExpressionObservable,
  faceExpressionPartner,
  faceExpressionRestNoise,
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
 * 4. A dip in the curve is flattened by the running maximum; an increment
 *    under twice the deviation of the population's rest readings of the
 *    unit (a unit read once has none) is indistinct and transfers nothing;
 *    a left/right pair is judged on its mean increment and mean deviation,
 *    so both sides transfer or neither does.
 * 5. Observability: a unit whose span reaches its photographs' 2-sigma
 *    spread passes, a unit narrower than it fails, and a left/right pair
 *    passes or fails together on its mean; fewer than two photographs and a
 *    calibration without its rest score refuse.
 * 6. Calibration documents: the rest document, then per channel and weight
 *    one document setting the channel and its left/right partner together;
 *    an unpaired channel, and a side whose partner the basis lacks, alone;
 *    a weight outside (0, 1] refuses.
 * 7. Partners: the same unit on the other side, the conjugate gaze for the
 *    eyes' in and out (up and down by side), none for the directional mouth
 *    and jaw units or a partner the channels lack.
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
  // Rest readings 0.1, 0.2 and 0.3 deviate by 0.1 (sample), so an increment
  // under 0.2 is indistinct and one over it transfers.
  const noise = faceExpressionRestNoise([
    { smile: 0.1, lone: 0.4 },
    { smile: 0.2 },
    { smile: 0.3 },
  ]);
  const gated = (photo: number) =>
    transferFaceExpression({
      calibration,
      observable,
      photo: { smile: photo },
      rest: { smile: 0.1 },
      noise,
    }).find((one) => one.channel === "smile")!;
  TestValidator.predicate(
    "within the identity's reading spread",
    nclose(noise.smile!, 0.1, 1e-12) &&
      noise.lone === 0 &&
      gated(0.25).status === "indistinct" &&
      gated(0.25).weight === 0 &&
      gated(0.35).status === "transferred" &&
      gated(0.35).weight > 0,
  );
  // A left/right pair is judged on its mean increment: 0.3 and 0.05 average
  // under twice the 0.1 deviation, 0.4 and 0.1 over it, and each side then
  // keeps its own reading.
  const paired = {
    eyeBlinkLeft: { weights: [0, 1], scores: [0, 1] },
    eyeBlinkRight: { weights: [0, 1], scores: [0, 1] },
  };
  const pair = (left: number, right: number) =>
    transferFaceExpression({
      calibration: paired,
      observable: ["eyeBlinkLeft", "eyeBlinkRight"],
      photo: { eyeBlinkLeft: left, eyeBlinkRight: right },
      rest: { eyeBlinkLeft: 0, eyeBlinkRight: 0 },
      noise: { eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 },
    }).map((one) => [one.status, one.weight]);
  TestValidator.equals(
    "a pair stands out together",
    [pair(0.3, 0.05), pair(0.4, 0.1)],
    [
      [
        ["indistinct", 0],
        ["indistinct", 0],
      ],
      [
        ["transferred", 0.4],
        ["transferred", 0.1],
      ],
    ],
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
  const documents = faceExpressionCalibrationDocuments({
    basis: "b",
    channels: ["smileLeft", "smileRight", "jaw", "lidLeft"],
    weights: [0.5, 1],
  });
  TestValidator.equals(
    "calibration documents",
    documents.map((one) => [one.id, one.expression]),
    [
      ["cal-rest-connected", {}],
      ["cal-smileLeft-050-connected", { smileLeft: 0.5, smileRight: 0.5 }],
      ["cal-smileLeft-100-connected", { smileLeft: 1, smileRight: 1 }],
      ["cal-smileRight-050-connected", { smileRight: 0.5, smileLeft: 0.5 }],
      ["cal-smileRight-100-connected", { smileRight: 1, smileLeft: 1 }],
      ["cal-jaw-050-connected", { jaw: 0.5 }],
      ["cal-jaw-100-connected", { jaw: 1 }],
      ["cal-lidLeft-050-connected", { lidLeft: 0.5 }],
      ["cal-lidLeft-100-connected", { lidLeft: 1 }],
    ],
  );
  const units = [
    "mouthSmileLeft",
    "mouthSmileRight",
    "eyeLookInLeft",
    "eyeLookOutRight",
    "eyeLookUpLeft",
    "eyeLookUpRight",
    "mouthLeft",
    "mouthRight",
    "jawLeft",
    "jawRight",
    "browDownLeft",
  ];
  TestValidator.equals(
    "partners",
    units.map((one) => faceExpressionPartner(one, units)),
    [
      "mouthSmileRight",
      "mouthSmileLeft",
      "eyeLookOutRight",
      "eyeLookInLeft",
      "eyeLookUpRight",
      "eyeLookUpLeft",
      null,
      null,
      null,
      null,
      null,
    ],
  );
  TestValidator.predicate(
    "calibration weight",
    documents.every((one) => one.basis === "b") &&
      throwsError(
        () =>
          faceExpressionCalibrationDocuments({
            basis: "b",
            channels: ["jaw"],
            weights: [0],
          }),
        "(0, 1]",
      ),
  );
};
