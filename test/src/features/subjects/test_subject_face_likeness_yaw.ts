import { TestValidator } from "@nestia/e2e";

import {
  faceLikenessCalibratedYaw,
  faceLikenessRelativeRotation,
  faceLikenessRotationVector,
} from "../../../scripts/face-review/faceLikenessGeometry";
import { planFaceLikenessYaws } from "../../../scripts/face-review/faceLikenessPlan";
import { nclose } from "../internal/predicates";

/** Rotation about +Y by `angle` radians, padded to a 4x4 detector matrix. */
const yaw = (angle: number): number[][] => [
  [Math.cos(angle), 0, Math.sin(angle), 0],
  [0, 1, 0, 0],
  [-Math.sin(angle), 0, Math.cos(angle), 0],
  [0, 0, 0, 1],
];

/**
 * Detector-calibrated camera yaw under one population rule.
 * Scenarios:
 * 1. The rotation vector of a known 0.3 rad turn about +Y is (0, 0.3, 0);
 *    the identity takes the small-angle branch and returns zero; the
 *    relative rotation of two yaws is their difference.
 * 2. A photograph turned 0.2 rad against a detector that answers 0.4 rad to
 *    a 45 degree render gives a 22.5 degree camera yaw; a vanishing
 *    calibration response returns null instead of dividing by it.
 * 3. A population of a measured subject (slope 45/0.4), a subject whose
 *    quarter render was undetected (it takes the median slope times its own
 *    0.1 rad, 11.25 degrees), one whose calibration response vanished
 *    (median slope too) and one whose photograph was undetected (missing).
 * 4. When no subject calibrated itself, a subject needing the population
 *    slope stays unavailable and the median slope is null.
 */
export const test_subject_face_likeness_yaw = (): void => {
  const vector = faceLikenessRotationVector(yaw(0.3));
  TestValidator.predicate(
    "known rotation vector",
    nclose(vector[0], 0) && nclose(vector[1], 0.3) && nclose(vector[2], 0),
  );
  TestValidator.equals(
    "identity",
    faceLikenessRotationVector(yaw(0)),
    [0, 0, 0],
  );
  const relative = faceLikenessRotationVector(
    faceLikenessRelativeRotation(yaw(0.5), yaw(0.2)),
  );
  TestValidator.predicate("relative rotation", nclose(relative[1], 0.3));

  TestValidator.predicate(
    "calibrated yaw",
    nclose(faceLikenessCalibratedYaw(0.2, 0.4)!, 22.5),
  );
  TestValidator.equals(
    "vanishing response",
    faceLikenessCalibratedYaw(0.2, 0),
    null,
  );

  const plan = planFaceLikenessYaws([
    { subject: "a", photo: yaw(0.2), front: yaw(0), quarter: yaw(0.4) },
    { subject: "b", photo: yaw(0.1), front: yaw(0), quarter: null },
    { subject: "c", photo: yaw(0.1), front: yaw(0), quarter: yaw(0) },
    { subject: "d", photo: null, front: yaw(0), quarter: yaw(0.4) },
  ]);
  TestValidator.predicate(
    "median slope",
    nclose(plan.medianDegreesPerRadian!, 45 / 0.4),
  );
  TestValidator.equals(
    "statuses",
    plan.rows.map((row) => row.status),
    [
      "measured",
      "population-calibrated",
      "population-calibrated",
      "face-undetected",
    ],
  );
  TestValidator.predicate("own yaw", nclose(plan.rows[0]!.yaw!, 22.5));
  TestValidator.predicate("population yaw", nclose(plan.rows[1]!.yaw!, 11.25));
  TestValidator.equals(
    "quarter recorded missing",
    plan.rows[1]!.quarterRelativeRotationVector,
    null,
  );
  TestValidator.predicate(
    "vanished response",
    nclose(plan.rows[2]!.yaw!, 11.25),
  );
  TestValidator.equals("missing photograph", plan.rows[3]!.yaw, null);

  const none = planFaceLikenessYaws([
    { subject: "b", photo: yaw(0.1), front: yaw(0), quarter: null },
  ]);
  TestValidator.equals("no slope", none.medianDegreesPerRadian, null);
  TestValidator.equals(
    "unavailable",
    none.rows[0]!.status,
    "calibration-unavailable",
  );
  TestValidator.equals("no yaw", none.rows[0]!.yaw, null);
};
