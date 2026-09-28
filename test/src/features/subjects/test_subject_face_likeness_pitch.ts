import { TestValidator } from "@nestia/e2e";

import {
  planFaceLikenessPitches,
  refineFaceLikenessPoses,
} from "../../../scripts/face-review/faceLikenessPlan";
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
/** A rotation of `degrees` about the vertical (y) axis. */
const yaw = (degrees: number): number[][] => {
  const a = (degrees * Math.PI) / 180;
  return [
    [Math.cos(a), 0, Math.sin(a)],
    [0, 1, 0],
    [-Math.sin(a), 0, Math.cos(a)],
  ];
};

/**
 * Detector-calibrated camera pitch.
 * Scenarios:
 * 1. A photograph turned 10 degrees about the horizontal axis against a
 *    frontal render, with the calibration render at a known 20 degrees
 *    reading 20, plans 10; a detector that reads the calibration at 16
 *    (its own scale) plans 12.5.
 * 2. A missing photograph, frontal or pitched render plans no pitch, and a
 *    pitched render that reads no response plans none.
 * 3. Refinement: a photograph at pitch 10 against a render taken at pose
 *    pitch 4 that reads 4 leaves a residual of 6, and the pose moves to 10
 *    with its yaw unchanged; a subject without a quarter calibration render
 *    takes the population's yaw response; a residual beyond the calibrated
 *    20 degrees is held; a missing render keeps the pose with no residual.
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
  const calibration = { front: identity, quarter: yaw(45), high: pitch(20) };
  const refined = refineFaceLikenessPoses([
    {
      subject: "a",
      pose: { yaw: 0, pitch: 4 },
      photo: pitch(10),
      render: pitch(4),
      ...calibration,
    },
    {
      subject: "b",
      pose: { yaw: 3, pitch: 0 },
      photo: yaw(8),
      render: yaw(3),
      ...calibration,
      quarter: null,
    },
    {
      subject: "c",
      pose: { yaw: 0, pitch: 0 },
      photo: pitch(50),
      render: identity,
      ...calibration,
    },
    {
      subject: "d",
      pose: { yaw: 1, pitch: 2 },
      photo: pitch(10),
      render: null,
      ...calibration,
    },
  ]);
  TestValidator.predicate(
    "refined",
    nclose(refined[0]!.pitch, 10, 1e-9) &&
      nclose(refined[0]!.yaw, 0, 1e-9) &&
      nclose(refined[1]!.yaw, 8, 1e-9) &&
      refined[2]!.held === true &&
      refined[2]!.pitch === 0 &&
      refined[3]!.residual === null &&
      refined[3]!.pitch === 2,
  );
};
