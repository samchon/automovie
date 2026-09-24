import { TestValidator } from "@nestia/e2e";

import { planFaceLikenessPitches } from "../../../scripts/face-review/faceLikenessPlan";
import { nclose } from "../internal/predicates";

/** A rotation of `degrees` about the horizontal (x) axis. */
const pitch = (degrees: number): number[][] => {
  const a = (degrees * Math.PI) / 180;
  return [
    [1, 0, 0],
    [0, Math.cos(a), -Math.sin(a)],
    [0, Math.sin(a), Math.cos(a)],
  ];
};
const identity = pitch(0);

/**
 * Detector-calibrated camera pitch.
 * Scenarios:
 * 1. A photograph turned 10 degrees about the horizontal axis against a
 *    frontal render, with the calibration render at a known 20 degrees
 *    reading 20, plans 10; a detector that reads the calibration at 16
 *    (its own scale) plans 12.5.
 * 2. A missing photograph, frontal or pitched render plans no pitch, and a
 *    pitched render that reads no response plans none.
 */
export const test_subject_face_likeness_pitch = (): void => {
  const rows = planFaceLikenessPitches([
    { subject: "a", photo: pitch(10), front: identity, high: pitch(20) },
    { subject: "b", photo: pitch(10), front: identity, high: pitch(16) },
    { subject: "c", photo: null, front: identity, high: pitch(20) },
    { subject: "d", photo: pitch(10), front: identity, high: null },
    { subject: "e", photo: pitch(10), front: identity, high: identity },
  ]);
  TestValidator.predicate(
    "calibrated",
    nclose(rows[0]!.pitch!, 10, 1e-9) && nclose(rows[1]!.pitch!, 12.5, 1e-9),
  );
  TestValidator.equals(
    "missing",
    rows.slice(2).map((row) => row.pitch),
    [null, null, null],
  );
};
